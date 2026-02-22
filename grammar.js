/// <reference types="tree-sitter-cli/dsl" />
// @ts-check

module.exports = grammar({
  name: "aura",

  extras: $ => [
    /\s/,
    $.comment,
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

    // Identifiers
    identifier: $ => /[a-zA-Z_][a-zA-Z0-9_]*/,
    
    type_identifier: $ => /[A-Z][a-zA-Z0-9_]*/,

    atom: $ => seq("'", $.identifier),

    dot_identifier: $ => seq(".", $.identifier),

    // Literals
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

    // Type expressions
    type_expr: $ => choice(
      $.type_identifier,
      $.tuple_type,
      $.struct_type,
      $.union_type,
      $.enum_type,
      $.interface_type,
      $.type_parameterized,
      $.func_type,
    ),

    type_parameters: $ => seq("[", commaSep($.type_expr), "]"),
    
    type_parameterized: $ => seq($.type_identifier, optional($.type_parameters)),

    tuple_type: $ => seq("(", commaSep($.type_expr), ")"),

    struct_type: $ => seq("(", commaSep($.struct_field_type), ")"),
    
    struct_field_type: $ => seq($.identifier, ":", $.type_expr),

    union_type: $ => seq("union", "(", commaSep($.type_expr), ")"),

    enum_type: $ => seq("enum", "(", commaSep($.enum_variant_type), ")"),
    
    enum_variant_type: $ => choice(
      $.identifier,
      seq($.identifier, ":", $.type_expr),
    ),

    interface_type: $ => seq("interface", "(", optional(commaSep($.struct_field_type)), ")"),

    func_type: $ => seq("Func", "[", commaSep2($.type_expr), "]"),

    // Declarations
    let_decl: $ => seq("let", $.binding, optional(seq(":", $.type_expr)), "=", $._expression),
    
    const_decl: $ => seq("const", $.binding, optional(seq(":", $.type_expr)), "=", $._expression),

    binding: $ => choice(
      $.identifier,
      $.tuple_pattern,
      $.struct_pattern,
      $.variant_pattern,
    ),

    fn_decl: $ => seq(
      "defn",
      optional(seq($.type_identifier, ".")),
      $.identifier,
      optional($.type_parameters),
      optional($.parameters),
      optional(seq("->", $.type_expr)),
      $.block,
    ),

    parameters: $ => seq("(", commaSep($.parameter), ")"),
    
    parameter: $ => seq(
      optional(seq($.identifier, $.identifier)), // external label
      $.identifier,
      optional(seq(":", $.type_expr)),
    ),

    def_decl: $ => seq(
      "def",
      optional($.type_parameters),
      $.identifier,
      optional(seq(":", $.type_expr)),
      "=",
      choice($.type_expr, $._expression),
    ),

    macro_decl: $ => seq(
      "defmacro",
      $.identifier,
      optional($.type_parameters),
      optional($.parameters),
      optional(seq("->", $.type_expr)),
      $.block,
    ),

    use_decl: $ => seq(
      "use",
      choice(
        $.identifier,
        seq("(", commaSep($.use_field), ")"),
      ),
      "=",
      $.string,
    ),

    use_field: $ => choice(
      $.identifier,
      seq($.identifier, "=", $.identifier),
    ),

    pub_modifier: $ => seq("pub", $._statement),

    // Expressions
    expression_statement: $ => seq($._expression, ";"),

    _expression: $ => choice(
      $.identifier,
      $.integer,
      $.float,
      $.boolean,
      $.null,
      $.string,
      $.list,
      $.dict,
      $.tuple,
      $.struct,
      $.closure,
      $.call_expression,
      $.field_access,
      $.safe_access,
      $.index_expression,
      $.binary_expression,
      $.unary_expression,
      $.range_expression,
      $.cast_expression,
      $.elvis_expression,
      $.force_unwrap,
      $.postfix_expression,
      $.atom,
      $.dot_identifier,
      $.block,
      $.parenthesized_expression,
    ),

    parenthesized_expression: $ => seq("(", $._expression, ")"),

    list: $ => seq("[", commaSep($.list_item), "]"),
    
    list_item: $ => seq(repeat($._statement), $._expression),

    dict: $ => seq("[", commaSep($.dict_entry), "]"),
    
    dict_entry: $ => seq(choice($.identifier, $._expression), "=", $._expression),

    tuple: $ => seq("(", commaSep($._expression), ")"),

    struct: $ => seq("(", commaSep($.struct_field), ")"),
    
    struct_field: $ => seq($.identifier, "=", $._expression),

    closure: $ => seq(
      "{",
      choice(
        seq(optional($.closure_params), optional(seq("->", $.type_expr)), repeat($._statement), optional($._expression)),
        commaSep($.closure_arm),
      ),
      "}",
    ),

    closure_params: $ => commaSep($.closure_param),
    
    closure_param: $ => choice(
      $.identifier,
      seq($.identifier, ":", $.type_expr),
    ),

    closure_arm: $ => seq(
      commaSep($.pattern),
      optional($.guard),
      "->",
      $._expression,
    ),

    guard: $ => seq("~", $._expression),

    pattern: $ => choice(
      $.identifier,
      "_",
      $.literal_pattern,
      $.type_check_pattern,
      $.struct_pattern,
      $.constructor_pattern,
      $.rest_pattern,
      $.variant_pattern,
      $.tuple_pattern,
    ),

    literal_pattern: $ => choice($.integer, $.float, $.boolean, $.null, $.string),
    
    type_check_pattern: $ => seq($.identifier, ":", $.type_expr),

    struct_pattern: $ => seq(
      optional($.type_identifier),
      "(",
      commaSep(choice(
        $.identifier,
        seq($.identifier, "=", $.identifier),
      )),
      optional($.rest_pattern),
      ")",
    ),

    constructor_pattern: $ => seq(
      $.type_identifier,
      "(",
      commaSep($.pattern),
      ")",
    ),

    rest_pattern: $ => seq("..", optional($.identifier)),

    variant_pattern: $ => seq(".", $.identifier, optional(seq("(", $.pattern, ")"))),

    tuple_pattern: $ => seq("(", commaSep($.pattern), ")"),

    call_expression: $ => seq(
      choice($.identifier, $.field_access, $.safe_access),
      optional(seq("(", commaSep($.argument), ")")),
      repeat($.trailing_closure),
    ),

    argument: $ => choice(
      $._expression,
      $.named_argument,
    ),

    named_argument: $ => seq($.identifier, "=", $._expression),

    trailing_closure: $ => seq(optional(seq($.identifier, optional($.atom))), $.closure),

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
    ),

    unary_expression: $ => prec(8, seq(choice("!", "-"), $._expression)),

    range_expression: $ => seq($._expression, "..", $._expression),

    cast_expression: $ => prec.left(9, seq($._expression, ":", $.type_expr)),

    elvis_expression: $ => prec.left(10, seq($._expression, "?:", $._expression)),

    force_unwrap: $ => seq($._expression, "!!"),

    postfix_expression: $ => choice(
      seq($._expression, "++"),
      seq($._expression, "--"),
    ),

    block: $ => seq("{", repeat($._statement), optional($._expression), "}"),
  },
});

function commaSep(rule) {
  return optional(seq(rule, repeat(seq(",", rule)), optional(",")));
}

function commaSep2(rule) {
  return seq(rule, repeat(seq(",", rule)), optional(","));
}
