import {
  bootstrapModeler,
  getBpmnJS
} from 'test/TestHelper';

import {
  ZeebeVariableResolverModule
} from '@bpmn-io/variable-resolver';

import ZeebeModdle from 'zeebe-bpmn-moddle/resources/zeebe';

import FormVariableProvider from 'lib/';

import placeholderXML from '../fixtures/placeholder.bpmn';
import startFormXML from '../fixtures/start-form.bpmn';
import sinon from 'sinon';


describe('<Form Extractor>', function() {

  function createModeler(xml) {
    return bootstrapModeler(xml, {
      moddleExtensions: {
        zeebe: ZeebeModdle
      },
      additionalModules: [
        ZeebeVariableResolverModule,
        FormVariableProvider
      ]
    })();
  }

  function createModelerWithForm(form) {
    const xml = placeholderXML.replace('{{form}}', form);
    createModeler(xml);
  }

  describe('local form', function() {

    it('should extract variables', async function() {

      // given
      const form = `{
        "components": [
          {
            "label": "Number",
            "type": "number",
            "layout": {
              "row": "Row_0tsd0f1",
              "columns": null
            },
            "id": "Field_164bcb2",
            "key": "Number_1"
          },
          {
            "label": "Text field",
            "type": "textfield",
            "layout": {
              "row": "Row_1l0lwcs",
              "columns": null
            },
            "id": "Field_1b97d86",
            "key": "Text_1"
          }
        ],
        "type": "default",
        "id": "Form_0",
        "schemaVersion": 10
      }`;

      await createModelerWithForm(form);
      const modeler = getBpmnJS();

      const elementRegistry = modeler.get('elementRegistry');
      const variableResolver = modeler.get('variableResolver');

      const task = elementRegistry.get('Task_1');

      // when
      const variables = await variableResolver.getVariablesForElement(task);

      // then
      expect(variables).to.variableEqual([
        { name: 'Number_1', info: 'Returned from Form in Form Task' },
        { name: 'Text_1', info: 'Returned from Form in Form Task' }
      ]);
    });


    it('should extract start forms', async function() {

      await createModeler(startFormXML);
      const modeler = getBpmnJS();

      const elementRegistry = modeler.get('elementRegistry');
      const variableResolver = modeler.get('variableResolver');

      const task = elementRegistry.get('StartEvent_1');

      // when
      const variables = await variableResolver.getVariablesForElement(task);

      // then
      expect(variables).to.variableEqual([
        { name: 'FormField_1', info: 'Returned from Form in StartEvent_1' }
      ]);

    });


    // https://github.com/bpmn-io/form-js/issues/777
    it.skip('should only extract output variables', async function() {

      // given
      const form = `{
        "components": [
          {
            "label": "Disabled",
            "type": "textfield",
            "layout": {
              "row": "Row_074dkdc",
              "columns": null
            },
            "id": "Field_0jervbt",
            "key": "disabled",
            "disabled": true,
            "readonly": true
          },
          {
            "label": "Enabled",
            "type": "textfield",
            "layout": {
              "row": "Row_1jeriyr",
              "columns": null
            },
            "id": "Field_1v2e029",
            "key": "Enabled"
          }
        ],
        "type": "default",
        "id": "Form_0hmakep",
        "executionPlatform": "Camunda Cloud",
        "executionPlatformVersion": "8.2.0",
        "exporter": {
          "name": "Camunda Modeler",
          "version": "5.15.0-nightly.20230815"
        },
        "schemaVersion": 10
      }`;

      await createModelerWithForm(form);
      const modeler = getBpmnJS();

      const elementRegistry = modeler.get('elementRegistry');
      const variableResolver = modeler.get('variableResolver');

      const task = elementRegistry.get('Task_1');

      // when
      const variables = await variableResolver.getVariablesForElement(task);

      // then
      expect(variables).to.variableEqual([
        { name: 'enabled', info: 'Returned from Form in Form Task' }
      ]);
    });


    it('should not fail on empty form', async function() {

      // given
      const form = '';

      await createModelerWithForm(form);
      const modeler = getBpmnJS();

      const elementRegistry = modeler.get('elementRegistry');
      const variableResolver = modeler.get('variableResolver');

      const task = elementRegistry.get('Task_1');

      // when
      const variables = await variableResolver.getVariablesForElement(task);

      // then
      expect(variables).to.variableEqual([ ]);
    });


    it('should not fail on broken form', async function() {

      // given
      const form = '{ noValidJSON ';

      await createModelerWithForm(form);
      const modeler = getBpmnJS();

      const elementRegistry = modeler.get('elementRegistry');
      const variableResolver = modeler.get('variableResolver');

      const task = elementRegistry.get('Task_1');

      // when
      const variables = await variableResolver.getVariablesForElement(task);

      // then
      expect(variables).to.variableEqual([ ]);
    });

  });


  describe('additional extractors', async function() {

    it('should allow async extractors', async function() {

      // given
      let clock = sinon.useFakeTimers();

      const form = `{
          "components": [
            {
              "label": "Number",
              "type": "number",
              "layout": {
                "row": "Row_0tsd0f1",
                "columns": null
              },
              "id": "Field_164bcb2",
              "key": "Number_1"
            },
            {
              "label": "Text field",
              "type": "textfield",
              "layout": {
                "row": "Row_1l0lwcs",
                "columns": null
              },
              "id": "Field_1b97d86",
              "key": "Text_1"
            }
          ],
          "type": "default",
          "id": "Form_0",
          "schemaVersion": 10
        }`;

      await createModelerWithForm('');
      const modeler = getBpmnJS();

      const eventBus = modeler.get('eventBus');
      const elementRegistry = modeler.get('elementRegistry');
      const variableResolver = modeler.get('variableResolver');

      const task = elementRegistry.get('Task_1');

      const MockProvider = ({ element }) => {
        if (element.id === task.id) {
          return new Promise(resolve => setTimeout(resolve(form), 100));
        }
      };

      eventBus.on('formVariableProvider.getFormSchema', MockProvider);

      // when
      const variables = await variableResolver.getVariablesForElement(task);
      await clock.tick(1000);

      // then
      expect(variables).to.variableEqual([
        { name: 'Number_1', info: 'Returned from Form in Form Task' },
        { name: 'Text_1', info: 'Returned from Form in Form Task' }
      ]);

      clock.restore();

    });

  });

});
