#!/usr/bin/env node

import { createProgram, getGlobalOptions } from './cli/program.js';
import { createStoreCommand } from './cli/commands/store.js';
import { createSearchCommand } from './cli/commands/search.js';

const program = createProgram();

program.addCommand(createStoreCommand(() => getGlobalOptions(program)));
program.addCommand(createSearchCommand(() => getGlobalOptions(program)));

program.parse();
