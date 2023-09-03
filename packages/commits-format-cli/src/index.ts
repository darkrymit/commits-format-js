#!/usr/bin/env node
import { cyan } from 'picocolors';
import { Command } from 'commander';
import figlet from 'figlet';
import fs from 'fs';
import JSON5 from 'json5';
import * as clipboardy from 'clipboardy';
import { type CommitFormatConfiguration } from './specification';
import packageJson from '../package.json';
import fastGlob from 'fast-glob';
import { log } from './logger';
import { resolveVariableValue, setValue } from './variables';

// eslint-disable-next-line @typescript-eslint/ban-types
function buildRenderFunction(textLiteral: string, argNames: string[]): Function {
  // eslint-disable-next-line @typescript-eslint/no-implied-eval,no-new-func
  return new Function(...argNames, 'return `' + textLiteral + '` ');
}

const handleSigTerm = () => process.exit(0);

process.on('SIGINT', handleSigTerm);
process.on('SIGTERM', handleSigTerm);

function generateBanner(): string {
  return cyan(
    figlet.textSync('Commits Format CLI', {
      horizontalLayout: 'default',
      verticalLayout: 'default',
    })
  );
}

const banner = generateBanner();

const program = new Command();

program
  .name('commits-format-cli')
  .description('CLI to Commits Format standard')
  .version(packageJson.version)
  .addHelpText('before', banner)
  .action(() => {
    program.help();
  });

interface FormatCommandOptions {
  json: string;
  text: boolean;
  clipboard: boolean;
  format: string;
  debug: boolean;
}

function createTemplateFunctions(context: any) {
  return {
    $eq: (value1: unknown, ...values: unknown[]) => {
      return values.every(value => value1 === value);
    },
    $in: (value: any, array: any[]) => {
      return array.includes(value);
    },
    $contains: (array: any[], value: any) => {
      if (array == undefined) {
        return false;
      }
      return array.includes(value);
    },
    $containsAny: (array: unknown[], ...values: unknown[]) => {
      if (array == undefined) {
        return false;
      }
      return values.some(value => array.includes(value));
    },
    $containsAll: (array: unknown[], ...values: unknown[]) => {
      if (array == undefined) {
        return false;
      }
      return values.every(value => array.includes(value));
    },
    $array: (...values: any[]) => {
      return values;
    },
    $exist: (value: any) => {
      return value != undefined;
    },
    $join: (array: any[], separator: string) => {
      if (array == undefined) {
        return '';
      }
      return array.join(separator);
    },
  };
}

function getFormatConfigFilePath(): string {
  const json5Files = fastGlob.sync('commits-format.json5', { cwd: process.cwd(), absolute: true });
  const jsonFiles = fastGlob.sync('commits-format.json', { cwd: process.cwd(), absolute: true });

  if (json5Files.length > 1) {
    throw new Error('Found more than one commits-format.json5 file in current directory');
  }
  if (jsonFiles.length > 1) {
    throw new Error('Found more than one commits-format.json file in current directory');
  }

  if (json5Files.length === 0 && jsonFiles.length === 0) {
    throw new Error(
      'No commits-format.json or commits-format.json5 file found in current directory'
    );
  }

  if (json5Files.length === 1 && jsonFiles.length === 1) {
    if (json5Files[0].slice(0, -5) !== jsonFiles[0].slice(0, -4)) {
      throw new Error(
        'Found different commits-format.json and commits-format.json5 files in current directory'
      );
    }
  }

  if (json5Files.length === 1) {
    return json5Files[0];
  }

  if (jsonFiles.length === 1) {
    return jsonFiles[0];
  }

  throw new Error(
    'Did not find commits-format.json or commits-format.json5 file in current directory'
  );
}

function loadFormat(commitsFormatConfig: CommitFormatConfiguration, formatName: string) {
  const format = commitsFormatConfig.formats.find((format: any) => format.name === formatName);
  if (format == undefined) {
    throw new Error(`Format ${formatName} not found`);
  }
  return format;
}

function loadConfig(): CommitFormatConfiguration {
  const filePath = getFormatConfigFilePath();
  log.debug(`Loading config file ${filePath}`);
  return JSON5.parse(fs.readFileSync(filePath, 'utf8'));
}

function createGlobalVariableResetObject(): Record<string, undefined> {
  return {
    window: undefined,
    document: undefined,
    fetch: undefined,
    XMLHttpRequest: undefined,
    console: undefined,
  };
}

program
  .command('format')
  .summary('create formatted commit text')
  .description(
    'Creates formatted commit text message according to Commits Format standard specified in repository'
  )
  .option('--text', 'Direct output to console in text', true)
  .option('--no-text', 'Dont output to console in text')
  .option('--clipboard', 'Copy output to clipboard', true)
  .option('--no-clipboard', 'Dont copy output to clipboard')
  .option('-f, --format <format>', 'Template name to format', 'default')
  .option('-d, --debug', 'Output extra debugging')
  .addHelpText('before', banner)
  .action(async (options: FormatCommandOptions) => {
    log.setDebugEnabled(options.debug);
    const { text, clipboard, format: formatName } = options;

    if (!clipboard && !text) {
      throw new Error('Both clipboard and text output are disabled');
    }

    log.debug('Loading commits-format');
    const commitsFormatConfig = loadConfig();
    log.debug('Successfully loaded commits-format');

    log.debug(`Loading ${formatName} format`);
    const format = loadFormat(commitsFormatConfig, formatName);
    console.log(`Successfully loaded ${formatName} format`);

    const context: Record<string, any> = {
      ...createGlobalVariableResetObject(),
    };
    const variables = format.variables ?? [];
    for (const variable of variables) {
      const value = await resolveVariableValue(variable, context);
      if (value != undefined) {
        log.debug(`Setting top level variable ${variable.id} as ${variable.name} to ${value}`);
        if (variable.name == undefined) {
          throw new Error('Variable name is not specified');
        }
        setValue(context, variable.name, value);
      } else {
        log.debug(`Skipping top level variable ${variable.id}`);
      }
    }

    log.debug('Building template function');
    if (format.template == undefined) {
      throw new Error(`Format ${formatName} does not have template`);
    }
    const renderString = format.template.string;
    if (renderString == undefined) {
      throw new Error(`Format ${formatName} does not have template string`);
    }
    log.debug(`Template string: ${renderString}`);

    log.debug('Checking for known arguments');
    format.template.knownArgs?.forEach(argName => {
      if (context[argName] == undefined) {
        context[argName] = undefined;
      }
    });
    log.debug('Successfully checked for known arguments');

    const templateFunctions = createTemplateFunctions(context);
    const renderFunction = buildRenderFunction(renderString, [
      ...Object.keys(context),
      ...Object.keys(templateFunctions),
    ]);
    log.debug('Successfully built template function');

    log.debug('Formatting data');
    const commitMessage = renderFunction(
      ...Object.values(context),
      ...Object.values(templateFunctions)
    );
    log.debug('Successfully formatted data');

    if (clipboard) {
      log.debug('Writing commit message to clipboard');
      clipboardy.writeSync(commitMessage);
      console.log('Commit message copied to clipboard');
      log.debug('Successfully wrote commit message to clipboard');
    }
    if (text) {
      log.debug('Writing commit message to console');
      console.log('Commit message:');
      console.log(commitMessage);
      log.debug('Successfully wrote commit message to console');
    }
  });

program.parseAsync(process.argv).catch(e => {
  if (e instanceof Error) {
    log.error(e.message);
  }
  process.exit(1);
});
