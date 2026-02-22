/// <reference types="tree-sitter-cli/dsl" />
// @ts-check

module.exports = grammar({
  name: "aura",

  extras: $ => [
    /\s/,
    $.comment,
  ],

  conflicts: $ => [
    [$.parenthesized_expression, $.tuple],
    [$._expression, $.named_argument],
    [$.def_decl, $.index_expression],
  ],

  rules: {
    source_file: $ => repeat($._statement),

    _statement: $ => choice(
      $.let_decl,
      $.const_decl,
      $.fn_decl,
      $.def_decl,
      $.macro_decl,
      $.use_decl,
      $.pub_modifier,
      $.expression_statement,
    ),

    comment: $ => token(seq("//", /.*/)),

    identifier: $ => /[a-zA-Z_][a-zA-Z0-9_]*/,
    
    type_identifier: $ => /[A-Z][a-zA-Z0-9_]*/,

    atom: $ => seq("'", $.identifier),

    dot_identifier: $ => seq(".", $.identifier),

    integer: $ => /\d[\d_]*/,
    
    float: $ => /\d[\d_]*\.\d[\d_]*/,
    
    boolean: $ => choice("true", "false"),
    
    null: $ => "null",

    string: $ => seq(
      '"',
      repeat(choice(
        $.string_content,
        $.escape_sequence,
        $.interpolation,
      )),
      '"'
    ),

    string_content: $ => /[^"\\$]+/,
    
    escape_sequence: $ => token(seq("\\", /./)),
    
    interpolation: $ => seq("$(", $._expression, ")"),

    type_expr: $ => choice(
      $.type_identifier,
      $.tuple_type,
      $.struct_type,
      $.union_type,
      $.enum_type,
      $.interface_type,
      $.func_type,
    ),

    tuple_type: $ => seq("(", commaSep($.type_expr), ")"),

    struct_type: $ => seq("(", commaSep1($.struct_field_type), ")"),
    
    struct_field_type: $ => seq($.identifier, ":", $.type_expr),

    union_type: $ => seq("union", "(", commaSep1($.type_expr), ")"),

    enum_type: $ => seq("enum", "(", commaSep1($.enum_variant_type), ")"),
    
    enum_variant_type: $ => choice(
      $.identifier,
      seq($.identifier, ":", $.type_expr),
    ),

    interface_type: $ => seq("interface", "(", optional(commaSep1($.struct_field_type)), ")"),

    func_type: $ => seq("Func", "[", commaSep1($.type_expr), "]"),

    let_decl: $ => seq("let", $.identifier, optional(seq(":", $.type_expr)), "=", $._expression, ";"),
    
    const_decl: $ => seq("const", $.identifier, optional(seq(":", $.type_expr)), "=", $._expression, ";"),

    fn_decl: $ => seq(
      "defn",
      optional(seq($.type_identifier, ".")),
      $.identifier,
      optional(seq("[", commaSep1($.type_identifier), "]")),
      $.parameters,
      optional(seq("->", $.type_expr)),
      $.block,
    ),

    parameters: $ => seq("(", commaSep($.parameter), ")"),
    
    parameter: $ => seq(
      $.identifier,
      optional(seq(":", $.type_expr)),
    ),

    def_decl: $ => seq(
      "def",
      optional(seq("[", commaSep1($.type_identifier), "]")),
      $.identifier,
      optional(seq(":", $.type_expr)),
      "=",
      $._expression,
      ";",
    ),

    macro_decl: $ => seq(
      "defmacro",
      $.identifier,
      optional(seq("[", commaSep1($.type_identifier), "]")),
      $.parameters,
      optional(seq("->", $.type_expr)),
      $.block,
    ),

    use_decl: $ => seq(
      "use",
      choice(
        $.identifier,
        seq("(", commaSep1($.use_field), ")"),
      ),
      "=",
      $.string,
      ";",
    ),

    use_field: $ => choice(
      $.identifier,
      seq($.identifier, "=", $.identifier),
    ),

    pub_modifier: $ => seq("pub", $._statement),

    expression_statement: $ => seq($._expression, ";"),

    _expression: $ => choice(
      $.identifier,
      $.integer,
      $.float,
      $.boolean,
      $.null,
      $.string,
      $.list,
      $.tuple,
      $.call_expression,
      $.field_access,
      $.safe_access,
      $.index_expression,
      $.binary_expression,
      $.unary_expression,
      $.cast_expression,
      $.elvis_expression,
      $.force_unwrap,
      $.atom,
      $.dot_identifier,
      $.block,
      $.parenthesized_expression,
    ),

    parenthesized_expression: $ => seq("(", $._expression, ")"),

    list: $ => seq("[", commaSep($._expression), "]"),

    tuple: $ => seq("(", commaSep1($._expression), ")"),

    block: $ => seq(
      "{",
      repeat($._statement),
      optional($._expression),
      "}",
    ),

    call_expression: $ => seq(
      $._expression,
      "(",
      commaSep($.argument),
      ")",
    ),

    argument: $ => choice(
      $._expression,
      $.named_argument,
    ),

    named_argument: $ => seq($.identifier, "=", $._expression),

    field_access: $ => seq($._expression, ".", $.identifier),

    safe_access: $ => seq($._expression, "?.", $.identifier),

    index_expression: $ => seq($._expression, "[", $._expression, "]"),

    binary_expression: $ => choice(
      prec.left(1, seq($._expression, "||", $._expression)),
      prec.left(2, seq($._expression, "&&", $._expression)),
      prec.left(3, seq($._expression, choice("==", "!="), $._expression)),
      prec.left(4, seq($._expression, choice("<", ">", "<=", ">="), $._expression)),
      prec.left(5, seq($._expression, choice("+", "-"), $._expression)),
      prec.left(6, seq($._expression, choice("*", "/", "%"), $._expression)),
      prec.right(7, seq($._expression, "=", $._expression)),
      prec.left(8, seq($._expression, "..", $._expression)),
    ),

    unary_expression: $ => prec(9, seq(choice("!", "-"), $._expression)),

    cast_expression: $ => prec.left(10, seq($._expression, ":", $.type_expr)),

    elvis_expression: $ => prec.left(11, seq($._expression, "?:", $._expression)),

    force_unwrap: $ => seq($._expression, "!!"),
  },
});

function commaSep(rule) {
  return optional(seq(rule, repeat(seq(",", rule)), optional(",")));
}

function commaSep1(rule) {
  return seq(rule, repeat(seq(",", rule)), optional(","));
}
