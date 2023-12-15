import { VariableProvider } from '@bpmn-io/variable-resolver';
import { getSchemaVariables } from '@bpmn-io/form-js';

/**
 * Variable Provider that parses example JSON from a specific Zeebe property
 */
class FormVariableProvider extends VariableProvider {
  constructor(eventBus, ...rest) {
    super(...rest);

    this._eventBus = eventBus;
  }

  async getVariables(element) {

    /**
     * Use the eventBus to collect form schemas. We currently only support locally defined forms,
     * but plan to have linked forms on a project level soon.
     */
    const formSchema = await this._eventBus.fire('formVariableProvider.getFormSchema', { element });

    if (!formSchema) {
      return;
    }

    let variables;
    try {
      variables = getSchemaVariables(
        JSON.parse(formSchema),
        {
          inputs : false,
          outputs : true
        }
      );
    }
    catch (err) {

      // invalid JSON or schema, ignore error
      return;
    }

    return variables.map(name => {
      return { name, info: `Returned from Form in ${element.name || element.id}` };
    });
  }

  static $inject = [ 'eventBus', ...super.$inject ];
}

export default FormVariableProvider;
