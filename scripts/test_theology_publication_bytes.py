import unittest
from unittest.mock import patch
from theology_publication_bytes import strip_expected_blocks, source_bytes

class PublicationByteTests(unittest.TestCase):
    def test_exact_blocks_only(self):
        original=b'<html>Original prose\r\n&amp; evidence</html>'
        head=b'<!-- theology-connectivity:head:start -->Exact head<!-- theology-connectivity:head:end -->'
        body=b'<!-- theology-connectivity:body:start -->Exact links<!-- theology-connectivity:body:end -->'
        self.assertEqual(strip_expected_blocks(head+original+body,(head,body)),original)
        for altered in (original,head+original,head+head+original+body,head+original+body.replace(b'Exact',b'Changed'),head+original+body+b'<!-- theology-connectivity:unexpected -->'):
            with self.assertRaises(ValueError):strip_expected_blocks(altered,(head,body))
    def test_unrelated_and_non_html_bytes_unchanged(self):
        original=b'\x00\xff<!-- theology-connectivity:literal data -->'
        with patch('theology_publication_bytes._blocks',side_effect=AssertionError('Must not inspect non-HTML')):
            self.assertEqual(source_bytes(original,'theology-wiki/example.json'),original)
        with patch('theology_publication_bytes._blocks',return_value=()):
            self.assertEqual(source_bytes(b'<html>Unrelated</html>','theology-wiki/other.html'),b'<html>Unrelated</html>')
    def test_no_path_traversal(self):
        with self.assertRaises(ValueError):source_bytes(b'', '../outside.html')

if __name__=='__main__':unittest.main()
