import {
  type ArrayTemplateVariable,
  type BooleanTemplateVariable,
  type IncludeCondition,
  isArrayTemplateVariable,
  isBooleanTemplateVariable,
  isListTemplateVariable,
  isMultiselectTemplateVariable,
  isSelectTemplateVariable,
  isStringTemplateVariable,
  type ListTemplateVariable,
  type MultiselectTemplateVariable,
  type OneOfTemplateVariable,
  type SelectTemplateVariable,
  type StringTemplateVariable,
} from './specification';
import { log } from './logger';
import prompts from 'prompts';
import { bold, gray, white } from 'picocolors';

export function setValue(context: any, path: string, value: any): void {
  const pathParts = path.split('.');
  let currentObject = context;
  for (let i = 0; i < pathParts.length - 1; i++) {
    const pathPart = pathParts[i];
    if (currentObject[pathPart] == undefined) {
      currentObject[pathPart] = {};
    }
    currentObject = currentObject[pathPart];
  }
  currentObject[pathParts[pathParts.length - 1]] = value;
}

export function getValue(context: any, path: string): any {
  const pathParts = path.split('.');
  let currentObject = context;
  for (let i = 0; i < pathParts.length - 1; i++) {
    const pathPart = pathParts[i];
    if (currentObject[pathPart] == undefined) {
      return undefined;
    }
    currentObject = currentObject[pathPart];
  }
  return currentObject[pathParts[pathParts.length - 1]];
}

function isNeedToInclude(context: any, condition?: IncludeCondition): boolean {
  if (condition == undefined) {
    return true;
  }

  if (condition.mode === 'exists') {
    if (condition.name == undefined) {
      throw new Error('Include condition name is not specified');
    }
    return getValue(context, condition.name) != undefined;
  }
  if (condition.mode === 'not-exists') {
    if (condition.name == undefined) {
      throw new Error('Include condition name is not specified');
    }
    return getValue(context, condition.name) == undefined;
  }
  if (condition.mode === 'true') {
    if (condition.name == undefined) {
      throw new Error('Include condition name is not specified');
    }
    return getValue(context, condition.name) === true;
  }
  if (condition.mode === 'false') {
    if (condition.name == undefined) {
      throw new Error('Include condition name is not specified');
    }
    return getValue(context, condition.name) === false;
  }

  // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
  throw new Error(`Unknown include condition mode ${condition.mode}`);
}

async function resolveStringVariableValue(
  variable: StringTemplateVariable,
  context: Record<string, any>
): Promise<string | undefined> {
  if (!isNeedToInclude(context, variable.includeOn)) {
    return undefined;
  }
  if (variable.value != undefined) {
    return variable.value;
  }
  const { value } = await prompts({
    type: 'text',
    name: 'value',
    message: variable.prompt,
  });
  if (value != undefined || value != '') {
    return value;
  }
  return variable.default;
}

async function resolveBooleanVariableValue(
  variable: BooleanTemplateVariable,
  context: Record<string, any>
): Promise<boolean | undefined> {
  if (!isNeedToInclude(context, variable.includeOn)) {
    return undefined;
  }
  if (variable.value != undefined) {
    return variable.value;
  }
  const { value } = await prompts({
    type: 'toggle',
    name: 'value',
    message: variable.prompt,
    initial: variable.initial,
    active: 'Yes',
    inactive: 'No',
  });
  return value;
}

async function resolveListVariableValue(
  variable: ListTemplateVariable,
  context: Record<string, any>
): Promise<Array<string | boolean> | undefined> {
  if (!isNeedToInclude(context, variable.includeOn)) {
    return undefined;
  }
  if (variable.value != undefined) {
    return variable.value;
  }
  let { value } = await prompts({
    type: 'list',
    name: 'value',
    message: variable.prompt,
    separator: variable.separator,
  });
  if (variable.items.type == 'boolean') {
    value = value.map((value: string) => value === 'true');
  }
  return value;
}

async function resolveArrayVariableValue(
  variable: ArrayTemplateVariable,
  context: Record<string, any>
): Promise<any[] | undefined> {
  if (!isNeedToInclude(context, variable.includeOn)) {
    return undefined;
  }
  if (variable.value != undefined) {
    return variable.value;
  }

  return await promptArrayVariable(variable, context);
}

async function promptArrayVariable(
  variable: ArrayTemplateVariable,
  context: Record<string, any>
): Promise<any[]> {
  const resultArray: any[] = [];
  console.log(
    `${bold(white(variable.prompt))}${
      variable.items.type == 'string' ? ` ${gray('(Enter empty string to finish)')}` : ''
    }`
  );

  while (true) {
    if (variable.items.type == 'string') {
      const item = await resolveStringVariableValue(variable.items, context);
      if (item == undefined || item == '') {
        break;
      }
      resultArray.push(item);
    } else if (variable.items.type == 'boolean') {
      const item = await resolveBooleanVariableValue(variable.items, context);
      if (item == undefined) {
        throw new Error(`Boolean variable ${variable.items.id} is not resolved`);
      }
      resultArray.push(item);
    }

    if (variable.items.type != 'string') {
      const { answer } = await prompts({
        type: 'toggle',
        name: 'answer',
        message: variable.continuePrompt ?? 'Do you want to add another item?',
        initial: false,
        active: 'Yes',
        inactive: 'No',
      });
      if (!answer) {
        break;
      }
    }
  }
  return resultArray;
}

async function resolveSelectVariableValue(
  variable: SelectTemplateVariable,
  context: Record<string, any>
): Promise<any | undefined> {
  if (!isNeedToInclude(context, variable.includeOn)) {
    return;
  }
  if (variable.value != undefined) {
    return variable.value;
  }
  return await promptSelectVariable(variable);
}

async function promptSelectVariable(
  variable: SelectTemplateVariable
): Promise<string | number | Record<string, any> | any[]> {
  const labels = variable.enum.map(value => {
    if (typeof value === 'string') {
      return value;
    }
    return value.label;
  });
  const defaultIndex = variable.initial ? labels.indexOf(variable.initial) : undefined;
  const disabled = variable.disabled ?? [];
  const { value } = await prompts({
    type: 'select',
    initial: defaultIndex,
    name: 'value',
    message: variable.prompt,
    choices: variable.enum.map(value => {
      if (typeof value === 'string') {
        return { title: value, value, disabled: disabled.includes(value) };
      }
      return {
        title: value.label,
        value: value.value,
        disabled: disabled.includes(value.label),
      };
    }),
  });
  return value;
}

async function resolveMultiselectVariableValue(
  variable: MultiselectTemplateVariable,
  context: Record<string, any>
): Promise<any | undefined> {
  if (!isNeedToInclude(context, variable.includeOn)) {
    return;
  }
  if (variable.value != undefined) {
    return variable.value;
  }
  return await promptMultiselectVariable(variable);
}

async function promptMultiselectVariable(variable: MultiselectTemplateVariable): Promise<any[]> {
  const disabled = variable.disabled ?? [];
  const selected = variable.selected ?? [];
  const { value } = await prompts({
    type: 'multiselect',
    name: 'value',
    message: variable.prompt,
    choices: variable.enum.map(value => {
      if (typeof value === 'string') {
        return {
          title: value,
          value,
          disabled: disabled.includes(value),
          selected: selected.includes(value),
        };
      }
      return {
        title: value.label,
        value: value.value,
        disabled: disabled.includes(value.label),
        selected: selected.includes(value.label),
      };
    }),
  });
  return value;
}

export async function resolveVariableValue(
  variable: OneOfTemplateVariable,
  context: Record<string, any>
): Promise<any | undefined> {
  if (isStringTemplateVariable(variable)) {
    log.debug(`Processing ${variable.id} as string`);
    return await resolveStringVariableValue(variable, context);
  }
  if (isBooleanTemplateVariable(variable)) {
    log.debug(`Processing ${variable.id}  as boolean`);
    return await resolveBooleanVariableValue(variable, context);
  }
  if (isListTemplateVariable(variable)) {
    log.debug(`Processing ${variable.id} as list`);
    return await resolveListVariableValue(variable, context);
  }
  if (isArrayTemplateVariable(variable)) {
    log.debug(`Processing ${variable.id} as array`);
    return await resolveArrayVariableValue(variable, context);
  }
  if (isSelectTemplateVariable(variable)) {
    log.debug(`Processing ${variable.id} as select`);
    return await resolveSelectVariableValue(variable, context);
  }
  if (isMultiselectTemplateVariable(variable)) {
    log.debug(`Processing ${variable.id} as multiselect`);
    return await resolveMultiselectVariableValue(variable, context);
  }
}
