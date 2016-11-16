
# Contents of this plugin will be reset by Kite on start. Changes you make
# are not guaranteed to persist

import sys

import sublime

PY3 = True if sys.version_info >= (3,) else False
ST3 = True if int(sublime.version()) >= 3000 else False

if PY3:
    defer = sublime.set_timeout_async
else:
    defer = sublime.set_timeout


def str_decode(s):
    """Decode a stream of bytes into a string in Python 3
    """

    if PY3:
        return s.decode('utf8')
    return s


def str_encode(s):
    """Encode some stringe into bytes in Python3
    """

    if PY3:
        return s.encode('utf8')
    return s
