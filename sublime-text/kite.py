# Contents of this plugin will be reset by Kite on start. Changes you make
# are not guaranteed to persist

from __future__ import print_function

try:
    from SublimeKite.log import enable_debug
    from SublimeKite.event_listeners import *
except ImportError:
    from log import enable_debug
    from event_listeners import *

DEBUG_ENABLED = True
FIX_APPLY_ERROR = (
    'It is with great regret we must inform you that we cannot apply the '
    'suggested fix. Please contact support@kite.com if the problem persists.'
    ''
    '- Kite Team'
)


def plugin_loaded():
    """Called by ST on plugin load
    """

    if DEBUG_ENABLED:
        enable_debug()


def plugin_unloaded():
    """Called from ST on plugin unload
    """

    pass
