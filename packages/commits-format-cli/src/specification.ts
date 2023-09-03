export type OneOfTemplateVariable =
  | BooleanTemplateVariable
  | StringTemplateVariable
  | ListTemplateVariable
  | ArrayTemplateVariable
  | SelectTemplateVariable
  | MultiselectTemplateVariable;

export type EnumItems =
  | {
      /**
       * The label of the enum value
       */
      label: string /**
       * The value of the enum value
       */;
      value: string | number | Record<string, any> | any[];
    }
  | string;

export interface CommitFormatConfiguration {
  /**
   * The version of the configuration file schema
   */
  version: string;
  /**
   * The formats array to use for the commit message
   */
  formats: Format[];
}

/**
 * A format object
 */
export interface Format {
  /**
   * The name of the format
   */
  name: string;
  /**
   * The description of the format
   */
  description?: string;
  /**
   * The variables to use for the template
   */
  variables?: OneOfTemplateVariable[];
  /**
   * The template for the format
   */
  template?: {
    /**
     * The mode of the render
     */
    mode?: 'string-literal' /**
     * The string to use for the render
     */;
    string?: string /**
     * The known arguments to use for the render function even if they don't have a value
     */;
    knownArgs?: string[];
  };
}

/**
 * The boolean variable object
 */
export interface BooleanTemplateVariable {
  /**
   * The id of the variable
   */
  id?: string;
  /**
   * The name of the variable in template
   */
  name?: string;
  /**
   * The type of the variable
   */
  type: 'boolean';
  /**
   * The description of the variable
   */
  description?: string;
  /**
   * The prompt to use for the variable in interactive mode
   */
  prompt?: string;
  /**
   * The value of the variable
   */
  value?: boolean;
  /**
   * The initial value of the variable
   */
  initial?: boolean;
  includeOn?: IncludeCondition;
}

export interface IncludeCondition {
  /**
   * The name of the variable to check
   */
  name?: string;
  /**
   * The mode of the check
   */
  mode: 'exists' | 'not-exists' | 'true' | 'false';
}

/**
 * The string variable object
 */
export interface StringTemplateVariable {
  /**
   * The id of the variable
   */
  id?: string;
  /**
   * The name of the variable in template
   */
  name?: string;
  /**
   * The type of the variable
   */
  type: 'string';
  /**
   * The description of the variable
   */
  description?: string;
  /**
   * The prompt to use for the variable in interactive mode
   */
  prompt?: string;
  /**
   * The value of the variable
   */
  value?: string;
  /**
   * The default value of the variable
   */
  default?: string;
  /**
   * Whether the variable is optional or not
   */
  optional?: boolean;
  includeOn?: IncludeCondition;
}

/**
 * The list variable object
 */
export interface ListTemplateVariable {
  /**
   * The id of the variable
   */
  id?: string;
  /**
   * The name of the variable in template
   */
  name?: string;
  /**
   * The type of the variable
   */
  type: 'list';
  /**
   * The description of the variable
   */
  description?: string;
  /**
   * The prompt to use for the variable in interactive mode
   */
  prompt?: string;
  /**
   * The items of the array
   */
  items: StringTemplateVariable | BooleanTemplateVariable;
  /**
   * The value of the variable
   */
  value?: any[];
  /**
   * The separator to use for the array items in interactive mode
   */
  separator?: string;
  includeOn?: IncludeCondition;
}

/**
 * The array variable object
 */
export interface ArrayTemplateVariable {
  /**
   * The id of the variable
   */
  id?: string;
  /**
   * The name of the variable in template
   */
  name?: string;
  /**
   * The type of the variable
   */
  type: 'array';
  /**
   * The description of the variable
   */
  description?: string;
  /**
   * The prompt to use for the variable in interactive mode
   */
  prompt?: string;
  /**
   * The items of the array
   */
  items: OneOfTemplateVariable;
  /**
   * The value of the variable
   */
  value?: any[];
  /**
   * The prompt to use to ask is user want to continue adding items to the array
   */
  continuePrompt?: string;
  includeOn?: IncludeCondition;
}

/**
 * The string enum variable object
 */
export interface SelectTemplateVariable {
  /**
   * The id of the variable
   */
  id?: string;
  /**
   * The name of the variable in template
   */
  name?: string;
  /**
   * The type of the variable
   */
  type: 'select';
  /**
   * The description of the variable
   */
  description?: string;
  /**
   * The prompt to use for the variable in interactive mode
   */
  prompt?: string;
  /**
   * The items of the array
   */
  items:
    | StringTemplateVariable
    | ListTemplateVariable
    | ArrayTemplateVariable
    | SelectTemplateVariable
    | MultiselectTemplateVariable;
  /**
   * The value of the variable
   */
  value?:
    | string
    | number
    | Record<string, any>
    | any[];
  /**
   * The enum values of the variable
   */
  enum: EnumItems[];
  /**
   * The disabled values of the variable
   */
  disabled?: string[];
  /**
   * The initial value of the variable
   */
  initial?: string;
  includeOn?: IncludeCondition;
}

/**
 * The array enum variable object
 */
export interface MultiselectTemplateVariable {
  /**
   * The id of the variable
   */
  id?: string;
  /**
   * The name of the variable in template
   */
  name?: string;
  /**
   * The type of the variable
   */
  type: 'multiselect';
  /**
   * The description of the variable
   */
  description?: string;
  /**
   * The prompt to use for the variable in interactive mode
   */
  prompt?: string;
  /**
   * The items of the array
   */
  items:
    | StringTemplateVariable
    | ListTemplateVariable
    | ArrayTemplateVariable
    | SelectTemplateVariable
    | MultiselectTemplateVariable;
  /**
   * The value of the variable
   */
  value?: Array<
    | string
    | number
    | Record<string, any>
    | any[]
  >;
  /**
   * The enum values of the variable
   */
  enum: EnumItems[];
  /**
   * The disabled values of the variable
   */
  disabled?: string[];
  /**
   * The selected values of the variable
   */
  selected?: string[];

  includeOn?: IncludeCondition;
}

export function isStringTemplateVariable(arg: any): arg is StringTemplateVariable {
  return arg && arg.type === 'string';
}

export function isBooleanTemplateVariable(arg: any): arg is BooleanTemplateVariable {
  return arg && arg.type === 'boolean';
}

export function isListTemplateVariable(arg: any): arg is ListTemplateVariable {
  return arg && arg.type === 'list';
}

export function isArrayTemplateVariable(arg: any): arg is ArrayTemplateVariable {
  return arg && arg.type === 'array';
}

export function isSelectTemplateVariable(arg: any): arg is SelectTemplateVariable {
  return arg && arg.type === 'select';
}

export function isMultiselectTemplateVariable(arg: any): arg is MultiselectTemplateVariable {
  return arg && arg.type === 'multiselect';
}
