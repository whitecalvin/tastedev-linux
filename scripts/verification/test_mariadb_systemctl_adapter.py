"""Exercise the actual verifier adapter without touching systemd."""
import ast
import pathlib
import unittest
from unittest.mock import patch


class AdapterTests(unittest.TestCase):
    def setUp(self):
        source = pathlib.Path(__file__).with_name('mariadb-helper-remote.py').read_text()
        tree = ast.parse(source)
        remote = next(node.value for node in tree.body if isinstance(node, ast.Assign)
                      and any(isinstance(t, ast.Name) and t.id == 'remote' for t in node.targets))
        # The remote script is a literal followed by parameter substitution.
        raw = ast.literal_eval(remote.func.value)
        inner = ast.parse(raw.replace('__PARAMETERS__', '{}'))
        assignment = next(node for node in ast.walk(inner) if isinstance(node, ast.Assign)
                          and any(isinstance(t, ast.Name) and t.id == 'adapter' for t in node.targets))
        self.adapter = eval(compile(ast.Expression(assignment.value), '<adapter-template>', 'eval'),
                            {'unit': 'tastedev-fixture.service', 'root': pathlib.Path('/tmp/fixture')})

    def invoke(self, args):
        with patch('sys.argv', ['systemctl'] + args), patch('os.execv') as execute:
            exec(compile(self.adapter, '<actual-systemctl-adapter>', 'exec'), {})
            return execute.call_args.args

    def test_status_with_trailing_options(self):
        executable, args = self.invoke(['show', 'mariadb.service', '--property=ActiveState,SubState', '--no-pager'])
        self.assertEqual(executable, '/tmp/fixture/systemctl-native')
        self.assertEqual(args[2:], ['tastedev-fixture.service', '--property=ActiveState,SubState', '--no-pager'])

    def test_helper_status_and_restart(self):
        for args in [['show', '--property=MainPID', '--value', 'mariadb.service'],
                     ['--no-ask-password', 'restart', 'mariadb.service']]:
            _, mapped = self.invoke(args)
            self.assertEqual(mapped[-1], 'tastedev-fixture.service')

    def test_other_unit_and_mutations_rejected(self):
        for args in [['show', 'nginx.service'], ['show', 'mariadb.service', 'nginx.service'],
                     ['show', 'mariadb.service', 'mariadb.service'], ['stop', 'mariadb.service']]:
            with self.subTest(args=args), self.assertRaises(AssertionError):
                self.invoke(args)


if __name__ == '__main__':
    unittest.main()
