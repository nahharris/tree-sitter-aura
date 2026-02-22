# Tree-sitter Aura

A [Tree-sitter](https://tree-sitter.github.io/tree-sitter/) grammar for the [Aura](https://github.com/nahharris/aura) programming language.

## Development

### Prerequisites

- Node.js (v14 or later)
- Tree-sitter CLI: `npm install -g tree-sitter-cli`

### Building

```bash
npm install
tree-sitter generate
tree-sitter test
```

### Testing

```bash
tree-sitter parse examples/example.aura
```

## License

MIT
