; Comments and literals
(comment) @comment
(string) @string
(string_content) @string
(escape_sequence) @string.escape
(interpolation) @embedded
(char) @string.special
(integer) @number
(float) @number.float
(alias_value) @constant.builtin

; Names
(function_declaration
  name: (identifier) @function)

(macro_declaration
  name: (identifier) @function.macro)

(assignment_declaration
  name: (identifier) @variable)

(call_expression
  callee: (identifier) @function.call)

(member_expression
  field: (identifier) @property)

(parameter
  name: (identifier) @variable.parameter)

(static_parameter
  name: (identifier) @type.parameter)

(named_type
  name: (identifier) @type)

(dot_identifier
  name: (identifier) @constructor)

(auon_dot_identifier
  name: (identifier) @constructor)

(dot_pattern
  name: (identifier) @constructor)

(struct_field
  name: (identifier) @property)

(struct_pattern_field
  name: (identifier) @property)

(use_field
  local: (identifier) @variable)

(use_field
  source: (identifier) @variable)

; Keywords
[
  "def"
  "defmacro"
  "use"
  "doc"
  "label"
  "static"
] @keyword

; Operators and punctuation
[
  "="
  "->"
  ":"
  "."
  ","
  ";"
  "||"
  "&&"
  "=="
  "!="
  "<"
  ">"
  "<="
  ">="
  "+"
  "-"
  "*"
  "/"
  "%"
  ".."
] @operator

[
  "("
  ")"
  "["
  "]"
  "{"
  "}"
] @punctuation.bracket
