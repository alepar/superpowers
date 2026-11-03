"""Command forms the agent uses to invoke relay."""
import os


def command_forms(install_path):
    """Bare `relay` and the real path of the installed binary."""
    return ["relay", os.path.realpath(install_path)]
