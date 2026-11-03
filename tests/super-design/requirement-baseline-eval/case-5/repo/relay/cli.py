"""relay command line."""
import argparse
import json
import os

from relay.install import run_setup

SETTINGS = os.path.expanduser("~/.agent/permissions.json")
CONFIG = os.path.expanduser("~/.config/relay/config.json")


def load_install_path(config_path=CONFIG):
    """`install_path` from relay's config file, written by the installer."""
    with open(config_path) as fh:
        return json.load(fh)["install_path"]


def main(argv=None):
    parser = argparse.ArgumentParser(prog="relay")
    sub = parser.add_subparsers(dest="command", required=True)
    setup = sub.add_parser("setup", help="install harness permission rules")
    setup.add_argument("--settings", default=SETTINGS)
    setup.add_argument("--config", default=CONFIG)
    human = sub.add_parser("human", help="pass a message to the human")
    human.add_argument("message", nargs="+")
    sub.add_parser("status", help="show relay status")
    args = parser.parse_args(argv)
    if args.command == "setup":
        run_setup(args.settings, load_install_path(args.config))
    elif args.command == "human":
        print("to human: " + " ".join(args.message))
    else:
        print("relay ok")
    return 0
