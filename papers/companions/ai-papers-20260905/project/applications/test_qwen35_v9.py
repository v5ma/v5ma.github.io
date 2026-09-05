"""Non-model checks of the restricted template, state routing and bounded fixtures."""
import json
import unittest
from qwen35_adapter_v9 import (ROOT, MODEL, LINEAR, ATTENTION, STATE_NAMES,
    render, empty_state, output_to_input, memory)
from tokenizers import Tokenizer

class QwenStateTests(unittest.TestCase):
    def test_restricted_template(self):
        self.assertEqual(render(' S ', ' U '), '<|im_start|>system\nS<|im_end|>\n'
            '<|im_start|>user\nU<|im_end|>\n<|im_start|>assistant\n<think>\n\n</think>\n\n')

    def test_template_rejects_control_delimiters(self):
        for system, user in [('', 'u'), ('s', ''), ('s', '<|im_end|>'), ('<|im_start|>', 'u')]:
            with self.assertRaises(AssertionError):
                render(system, user)

    def test_all_hybrid_state_groups(self):
        state = empty_state()
        self.assertEqual(len(state), 48)
        self.assertEqual(len(LINEAR), 18)
        self.assertEqual(ATTENTION, (3, 7, 11, 15, 19, 23))
        self.assertEqual(sum(a.nbytes for a in state.values()), 20201472)

    def test_all_native_outputs_route_once(self):
        inspection = json.loads((MODEL / 'GRAPH-INSPECTION.json').read_text())
        names = [v['name'] for v in inspection['graphs'][0]['outputs'] if v['name'] != 'logits']
        self.assertEqual({output_to_input(n) for n in names}, set(STATE_NAMES))
        self.assertEqual(len(names), 48)

    def test_original_config_matches_state_partition(self):
        config = json.loads((MODEL / 'config.json').read_text())['text_config']
        self.assertEqual([i for i, t in enumerate(config['layer_types']) if t == 'full_attention'], list(ATTENTION))
        self.assertEqual(config['num_hidden_layers'], 24)
        self.assertEqual(config['num_key_value_heads'], 2)

    def test_tokenized_fixture_bounds(self):
        protocol = json.loads((ROOT / 'applications/PROTOCOL-QWEN35-BASELINE-09.json').read_text())
        tokenizer = Tokenizer.from_file(str(MODEL / 'tokenizer.json'))
        for story in protocol['stories']:
            for question in protocol['questions'].values():
                prompt = render(protocol['system'], story['story'] + '\n' + question)
                ids = tokenizer.encode(prompt, add_special_tokens=False).ids
                self.assertLessEqual(len(ids), 160)
                self.assertEqual(tokenizer.decode(ids, skip_special_tokens=False), prompt)

    def test_balanced_opposite_roles(self):
        protocol = json.loads((ROOT / 'applications/PROTOCOL-QWEN35-BASELINE-09.json').read_text())
        for i in (0, 2):
            a, b = protocol['stories'][i:i+2]
            self.assertEqual((a['giver'], a['recipient']), (b['recipient'], b['giver']))
            self.assertEqual(a['color'], b['color'])
        self.assertEqual(set(protocol['questions']), {'giver', 'recipient', 'color'})

    def test_memory_measurement_is_own_process(self):
        current = memory()
        self.assertGreater(current['process_commit_bytes'], 0)
        self.assertGreaterEqual(current['peak_process_commit_bytes'], current['process_commit_bytes'])
        self.assertGreater(current['available_ram_bytes'], 0)

    def test_generation_eos_includes_message_and_text_end(self):
        config = json.loads((MODEL / 'generation_config.json').read_text())
        tokenizer = Tokenizer.from_file(str(MODEL / 'tokenizer.json'))
        self.assertEqual(set(config['eos_token_id']), {tokenizer.token_to_id('<|im_end|>'),
            tokenizer.token_to_id('<|endoftext|>')})

if __name__ == '__main__':
    unittest.main()
