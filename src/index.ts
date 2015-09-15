/// <reference path="./typings.d.ts" />
'use strict';
require('source-map-support').install();
require('crash-reporter').start();
import Application from './server/application';

Application.new();
