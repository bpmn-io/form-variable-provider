import { getBusinessObject, is } from 'bpmn-js/lib/util/ModelUtil';

export function getExtensionElements(element, type) {
  const bo = getBusinessObject(element);

  let elements = [];
  const extensionElements = bo.get('extensionElements');

  if (typeof extensionElements !== 'undefined') {
    const extensionValues = extensionElements.get('values');

    if (typeof extensionValues !== 'undefined') {
      elements = extensionValues.filter(e => is(e, type));
    }
  }

  return elements;
}