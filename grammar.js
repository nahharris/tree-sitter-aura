/// <reference types="tree-sitter-cli/dsl" />
// @ts-check

const PREC = {
  ASSIGN: 1,
  OR: 2,
  AND: 3,
  EQ: 4,
  COMPARE: 5,
  RANGE: 6,
  ADD: 7,
  MUL: 8,
  CAST: 9,
  MACRO_APPLY: 10,
  MEMBER: 11,
  CALL: 12,
};

module.exports = grammar({
  name: "aura",

  extras: $ => [
    /\s/,
    $.comment,
  ],

  word: $ => $.identifier,

  supertypes: $ => [
    $._expression,
    $._type_expression,
    $._pattern,
  ],

  conflicts: $ => [
    [$.assignment_declaration, $.function_declaration],
    [$.tuple_expression, $.struct_expression],
    [$.parenthesized_expression, $.tuple_expression],
    [$.tuple_type, $.struct_type],
    [$.list_expression, $.dict_expression],
    [$.call_expression, $.macro_apply_expression],
    [$.member_expression, $.macro_apply_expression],
    [$._primary_expression, $.auon_dict_key],
    [$._primary_expression, $._auon_value],
    [$.named_type, $._primary_expression],
    [$._primary_expression, $._pattern],
    [$.struct_type_field, $._primary_expression],
    [$.value_static_argument, $._primary_expression],
    [$.value_static_argument, $.named_type],
    [$.value_static_argument, $.named_type, $._primary_expression],
    [$.value_static_argument, $._primary_expression, $._auon_value],
    [$.static_parameter, $._type_expression],
    [$.placeholder, $.infer_type],
    [$.placeholder, $.wildcard_pattern],
    [$.string, $._plain_string],
    [$.dot_identifier],
    [$.dot_identifier, $.auon_dot_identifier],
    [$.dot_pattern, $.dot_identifier],
    [$.dot_pattern, $.dot_identifier, $.auon_dot_identifier],
    [$.root_list, $.root_struct, $.root_dict],
  ],

  rules: {
    source_file: $ => choice(
      repeat1($._declaration),
      $.auon_document,
    ),

    _declaration: $ => choice(
      $.assignment_declaration,
      $.function_declaration,
      $.macro_declaration,
      $.use_declaration,
    ),

    comment: _ => token(choice(
      seq("//", /.*/),
      seq("/*", /[^*]*\*+([^/*][^*]*\*+)*/, "/"),
    )),

    identifier: _ => /[A-Za-z_][A-Za-z0-9_]*/,

    integer: _ => /-?\d[\d_]*/,
    float: _ => /-?\d[\d_]*\.\d[\d_]*/,

    string: $ => seq(
      '"',
      repeat(choice(
        $.string_content,
        $.escape_sequence,
        $.interpolation,
      )),
      '"',
    ),

    _plain_string: $ => alias(seq(
      '"',
      repeat(choice(
        $.string_content,
        $.escape_sequence,
      )),
      '"',
    ), $.string),

    string_content: _ => token.immediate(prec(1, /[^"\\$]+/)),
    escape_sequence: _ => token.immediate(seq("\\", /./)),
    interpolation: $ => seq("$(", $._expression, ")"),

    char: _ => token(seq("'", choice(/[^'\\]/, /\\./), "'")),

    alias_value: _ => choice("true", "false", "null"),
    placeholder: _ => "_",
    wildcard_pattern: _ => "_",

    assignment_declaration: $ => seq(
      optional(field("doc", $.doc_attribute)),
      "def",
      optional(field("static_parameters", $.static_parameters)),
      field("name", $.identifier),
      optional(seq(":", field("declared_type", $._type_expression))),
      "=",
      field("value", $._expression),
    ),

    function_declaration: $ => seq(
      optional(field("doc", $.doc_attribute)),
      "def",
      optional(field("static_parameters", $.static_parameters)),
      optional(seq(field("receiver", $._type_expression), ".")),
      field("name", $.identifier),
      field("parameters", $.parameters),
      "->",
      field("return_type", $._type_expression),
      field("body", $.block_expression),
    ),

    macro_declaration: $ => seq(
      "defmacro",
      optional(field("static_parameters", $.static_parameters)),
      field("name", $.identifier),
      field("parameters", $.parameters),
      "->",
      field("return_type", $._type_expression),
      field("body", $.block_expression),
    ),

    use_declaration: $ => seq(
      "use",
      field("binding", choice($.identifier, $.use_fields)),
      "=",
      field("source", $.string),
    ),

    use_fields: $ => seq("(", commaSep1($.use_field), ")"),

    use_field: $ => choice(
      seq(
        field("local", $.identifier),
        "=",
        field("source", $.identifier),
      ),
      seq(field("source", $.identifier)),
    ),

    doc_attribute: $ => seq("doc", $.static_arguments),

    static_parameters: $ => seq("[", commaSep1($.static_parameter), "]"),

    static_parameter: $ => seq(
      field("name", $.identifier),
      optional(seq(":", field("constraint", choice($.static_type, $._type_expression)))),
    ),

    static_arguments: $ => seq("[", commaSep1(choice($.type_static_argument, $.value_static_argument)), "]"),
    type_static_argument: $ => $._type_expression,
    value_static_argument: $ => choice(
      $.integer,
      $.float,
      $.string,
      $.char,
      $.identifier,
      $.alias_value,
      $.dot_identifier,
      $.placeholder,
    ),

    parameters: $ => seq("(", commaSep($.parameter), ")"),

    parameter: $ => seq(
      field("name", $.identifier),
      ":",
      field("type", $._type_expression),
    ),

    _type_expression: $ => choice(
      $.static_type,
      $.named_type,
      $.tuple_type,
      $.struct_type,
      $.infer_type,
    ),

    static_type: $ => seq("static", $._type_expression),
    infer_type: _ => "_",

    named_type: $ => seq(
      field("name", $.identifier),
      optional(field("static_arguments", $.static_arguments)),
    ),

    tuple_type: $ => seq("(", commaSep1($._type_expression), ")"),

    struct_type: $ => seq("(", commaSep1($.struct_type_field), ")"),

    struct_type_field: $ => seq(
      field("name", $.identifier),
      ":",
      field("type", $._type_expression),
    ),

    _expression: $ => choice(
      $.assignment_expression,
      $.binary_expression,
      $.cast_expression,
      $.macro_apply_expression,
      $.call_expression,
      $.member_expression,
      $._primary_expression,
    ),

    _primary_expression: $ => choice(
      $.identifier,
      $.integer,
      $.float,
      $.string,
      $.char,
      $.alias_value,
      $.dot_identifier,
      $.tuple_expression,
      $.struct_expression,
      $.list_expression,
      $.dict_expression,
      $.block_expression,
      $.multi_arm_expression,
      $.label_expression,
      $.parenthesized_expression,
      $.placeholder,
    ),

    parenthesized_expression: $ => seq("(", $._expression, ")"),

    tuple_expression: $ => seq("(", commaSep1($._expression), ")"),

    struct_expression: $ => seq("(", commaSep1($.struct_field), ")"),

    struct_field: $ => seq(
      field("name", $.identifier),
      "=",
      field("value", choice($._expression, $._auon_value)),
    ),

    list_expression: $ => seq("[", commaSep(choice($._expression, $._auon_value)), "]"),

    dict_expression: $ => seq("[", commaSep($.dict_entry), "]"),

    dict_entry: $ => seq(
      field("key", choice($._expression, $.auon_dict_key)),
      "=",
      field("value", choice($._expression, $._auon_value)),
    ),

    member_expression: $ => prec.left(PREC.MEMBER, seq(
      field("object", choice($._primary_expression, $.call_expression, $.member_expression)),
      ".",
      field("field", $.identifier),
    )),

    _callable_expression: $ => choice(
      $.identifier,
      $.integer,
      $.float,
      $.string,
      $.char,
      $.alias_value,
      $.tuple_expression,
      $.struct_expression,
      $.list_expression,
      $.dict_expression,
      $.block_expression,
      $.multi_arm_expression,
      $.label_expression,
      $.parenthesized_expression,
      $.placeholder,
      $.member_expression,
      $.call_expression,
    ),

    arguments: $ => seq("(", commaSep($._expression), ")"),

    labeled_closure_argument: $ => seq(
      field("label", $.identifier),
      field("body", $.block_expression),
    ),

    call_expression: $ => prec.left(PREC.CALL, seq(
      field("callee", $._callable_expression),
      optional(field("static_arguments", $.static_arguments)),
      choice(
        field("arguments", $.arguments),
        seq(
          field("arguments", $.arguments),
          repeat1($.labeled_closure_argument),
        ),
        repeat1($.labeled_closure_argument),
      ),
    )),

    macro_apply_expression: $ => prec.right(PREC.MACRO_APPLY, seq(
      field("name", $.identifier),
      optional(field("static_arguments", $.static_arguments)),
      field("operand", $._macro_operand),
    )),

    _macro_operand: $ => choice(
      $.identifier,
      $.integer,
      $.float,
      $.string,
      $.char,
      $.alias_value,
      $.list_expression,
      $.dict_expression,
      $.block_expression,
      $.label_expression,
      $.macro_apply_expression,
    ),

    assignment_expression: $ => prec.right(PREC.ASSIGN, seq(
      field("left", $.identifier),
      "=",
      field("right", $._expression),
    )),

    binary_expression: $ => choice(
      prec.left(PREC.OR, seq($._expression, "||", $._expression)),
      prec.left(PREC.AND, seq($._expression, "&&", $._expression)),
      prec.left(PREC.EQ, seq($._expression, choice("==", "!="), $._expression)),
      prec.left(PREC.COMPARE, seq($._expression, choice("<", ">", "<=", ">="), $._expression)),
      prec.left(PREC.RANGE, seq($._expression, "..", $._expression)),
      prec.left(PREC.ADD, seq($._expression, choice("+", "-"), $._expression)),
      prec.left(PREC.MUL, seq($._expression, choice("*", "/", "%"), $._expression)),
    ),

    cast_expression: $ => prec.left(PREC.CAST, seq(
      field("value", choice($._primary_expression, $.member_expression, $.call_expression)),
      ":",
      field("type", $._type_expression),
    )),

    block_expression: $ => seq(
      "{",
      repeat($.block_item),
      optional($._expression),
      "}",
    ),

    block_item: $ => seq($._expression, ";"),

    label_expression: $ => seq(
      "label",
      "[",
      $.dot_identifier,
      "]",
      choice($.multi_arm_expression, $.block_expression),
    ),

    multi_arm_expression: $ => seq("{", commaSep1($.arm), "}"),

    arm: $ => seq(
      optional(seq($._pattern, repeat(seq(",", $._pattern)))),
      optional(seq("~", field("guard", $._expression))),
      "->",
      field("body", $._expression),
    ),

    _pattern: $ => choice(
      $.wildcard_pattern,
      $.identifier,
      $.dot_pattern,
      $.struct_pattern,
    ),

    dot_pattern: $ => prec(PREC.CALL + 1, seq(
      ".",
      field("name", $.identifier),
      optional(seq("(", field("payload", choice($.variant_struct_pattern, $._pattern)), ")")),
    )),

    dot_identifier: $ => prec(PREC.CALL + 1, seq(
      ".",
      field("name", $.identifier),
      optional(seq("(", field("payload", choice($.variant_struct_expression, $._expression, $._auon_value)), ")")),
    )),

    variant_struct_expression: $ => commaSep1($.struct_field),

    struct_pattern: $ => seq("(", commaSep1($.struct_pattern_field), ")"),

    variant_struct_pattern: $ => commaSep1($.struct_pattern_field),

    struct_pattern_field: $ => seq(
      field("name", $.identifier),
      "=",
      field("value", $._pattern),
    ),

    auon_dot_identifier: $ => seq(
      ".",
      field("name", $.identifier),
      optional(seq("(", field("payload", $._auon_value), ")")),
    ),

    auon_document: $ => choice(
      $.root_struct,
      $.root_dict,
      $.root_list,
      $._auon_value,
    ),

    _auon_value: $ => choice(
      $.integer,
      $.float,
      $._plain_string,
      $.char,
      $.alias_value,
      $.auon_dot_identifier,
      $.tuple_expression,
      $.struct_expression,
      $.list_expression,
      $.dict_expression,
    ),

    auon_dict_key: $ => choice(
      $.integer,
      $.float,
      $._plain_string,
      $.char,
      $.alias_value,
      $.auon_dot_identifier,
      $.tuple_expression,
      $.struct_expression,
      $.list_expression,
      $.dict_expression,
    ),

    root_struct: $ => commaSep1($.struct_field),
    root_dict: $ => commaSep1($.dict_entry),
    root_list: $ => seq($._auon_value, ",", commaSep($._auon_value)),
  },
});

function commaSep(rule) {
  return optional(commaSep1(rule));
}

function commaSep1(rule) {
  return seq(rule, repeat(seq(",", rule)), optional(","));
}
