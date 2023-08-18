import { is } from 'bpmn-js/lib/util/ModelUtil';
import { getExtensionElements } from '../util/extensionElementUtil';

/**
 * Subscribe to the eventBus and handle Forms that are defined locally in the
 * Process.
 */
export default function formExtractor(eventBus) {
  eventBus.on('formVariableProvider.getFormSchema', getLocalForm);
}

formExtractor.$inject = [ 'eventBus' ];

// helpers ////////////

function getLocalForm({ element }) {
  const formDefinition = getExtensionElements(element, 'zeebe:FormDefinition')[0];

  if (!formDefinition) {
    return;
  }

  const formKey = formDefinition.formKey;

  if (!formKey) {
    return;
  }

  const formId = formKey.replace('camunda-forms:bpmn:', '');
  const process = getProcess(element);

  const taskForms = getExtensionElements(process, 'zeebe:UserTaskForm');

  const form = taskForms.find(form => form.id === formId);

  if (!form) {
    return;
  }

  return form.body;
}

function getProcess(element) {
  let parent = element.$parent;

  while (parent && !is(parent, 'bpmn:Process')) {
    parent = parent.$parent;
  }

  return parent;
}
