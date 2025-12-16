#!/usr/bin/env node

import { createProgram, getGlobalOptions } from './cli/program.js';
import { createStoreCommand } from './cli/commands/store.js';

const program = createProgram();

program.addCommand(createStoreCommand(() => getGlobalOptions(program)));

program.parse();
