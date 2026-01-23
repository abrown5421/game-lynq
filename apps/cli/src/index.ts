#!/usr/bin/env node

import { run } from "./app/run.js";
import { showBanner } from "./shared/banner.js";

showBanner();
await run();
