import argparse
import sys

from stash import commands


def main(argv=None):
    parser = argparse.ArgumentParser(prog="stash")
    sub = parser.add_subparsers(dest="command", required=True)

    save = sub.add_parser("save", help="copy a directory into a backend")
    save.add_argument("source")
    save.add_argument("--backend", required=True)
    save.add_argument("--dest", required=True)

    lst = sub.add_parser("list", help="list stored snapshots")
    lst.add_argument("--backend", required=True)
    lst.add_argument("--dest", required=True)

    check = sub.add_parser("check", help="check that a backend is usable")
    check.add_argument("--backend", required=True)

    args = parser.parse_args(argv)
    if args.command == "save":
        return commands.save(args.source, args.backend, args.dest)
    if args.command == "list":
        return commands.list_snapshots(args.backend, args.dest)
    return commands.check(args.backend)


if __name__ == "__main__":
    sys.exit(main())
