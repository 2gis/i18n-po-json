# i18n-po-json

`pojson` is a CLI tool to convert gettext PO format to JSON i18n entry list.

## Command-line usage

To install pojson system-wide, run:
```
$ sudo npm install -g i18n-po-json
```
Then you can use it like this:
```
$ pojson --help
i18n PO -> JSON converter

Options:
   -h / --help                            Show this help
   -s / --src FILE                        Define input JSON file name. Defaults
                                          to stdin.
   -o / --output FILE                     Define output POT file name. If a file
                                          already exists, it's contents will be
                                          overwritten. Defaults to stdout.
   -n / --withOccurences                  Include occurences info into JSON file,
                                          parsed from "#: ..." comments.
   -c / --withComments                    Include comments into JSON file, parsed
                                          from "#. ..." comments.
   -p / --prettify                        Pretty-print JSON output.
   -m / --withMeta["full" | "plural"]     Include parsed PO header or plural form
                                          into JSON file. Add all header values
                                          without any params provided. Possable
                                          values "" | "full" | "plural"
```
By default pojson accepts input PO file from stdin. Output defaults to stdout, so you can use standard unix stream redirection syntax. Errors and warnings are printed to stderr.

Usage example:
```
$ cat ~/some/path/en_AE.po | pojson -p --withMeta plural > /dev/null
```

## API usage

Take a look at [CLI entry point - index.ts](https://github.com/2gis/i18n-po-json/blob/master/index.ts). Usage of the one and only `convert` function is pretty straightforward and there you will find all examples you ever need. Also you may want to take a look on unit tests to know how to collect errors and warnings efficiently when using `convert` programmatically.

## Contributing

i18n-po-json uses github-flow to accept & merge fixes and improvements. Basic process is:
- Fork the repo.
- Create a branch.
- Add or fix some code.
- **Run Karma testing suite with `npm run test` and make sure nothing is broken**
- Add some tests for your new code or fix broken tests.
- Run `npm run build` to build pure-js distribution files.
- Commit & push.
- Create a new pull request to original repo.

Pull requests with failing tests will not be accepted. Also, if you add or modify packages to `package.json`, make sure you use `yarn` and update `yarn.lock`.
