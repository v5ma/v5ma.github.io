# Preparation guard failure, before model inference

The first fixture preparation stopped at its EOS-in-prompt assertion. No model session or inference was started, and no prepared fixture or source-freeze artifact had been written.

Cause: the initial adapter/guard used the text configuration's `eos_token_id=248044` as though it were the message-end delimiter. The exact downloaded tokenizer maps `<|im_end|>` to 248046 and `<|endoftext|>` to 248044. The pinned generation configuration includes **both** EOS IDs. The fixture has message ends but no text-end token; its 56-token first prompt was within the declared context bound.

Repair before freezing executable inputs: use the tokenizer's actual message-end ID for the fixture guard, and load both generation EOS IDs for stopping. The protocol already specified configured EOS and does not require revision. Added a direct tokenizer/generation-configuration consistency test. Preserve this failed attempt as an implementation error, not a model failure or a semantic result.
