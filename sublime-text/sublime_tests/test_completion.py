import sys
import unittest

import sublime


class TestSublimeKiteCompletion(unittest.TestCase):
    """Tests SublimeKite Completion functionality
    """

    def setUp(self):
        self.view = sublime.active_window().new_file()
        s = sublime.load_settings('Preferences.sublime-settings')
        s.set('close_windows_when_empty', False)

    def tearDown(self):
        if self.view:
            self.view.set_sratch(True)
            self.view.window().focus_view(self.view)
            self.view.window().run_command('close_file')


if int(sublime.version()) < 3000:
    # we are running in ST3 :<
    sublime_kite = sys.modules['SublimeKite']
else:
    # we are running in ST3 :)
    sublime_kite = sys.modules['SublimeKite.SublimeKite']


class TestInnerMethods(unittest.TestCase):
    """Tests inner methods and stuff
    """

