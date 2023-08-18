import FormVariableProvider from './variableProvider';
import formExtractor from './formExtractor';

export default {
  __init__: [
    'formVariableProvider',
    'formVariableProvider.formExtractor'
  ],
  formVariableProvider: [ 'type', FormVariableProvider ],
  'formVariableProvider.formExtractor': [ 'type', formExtractor ]
};
