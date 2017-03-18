import AbstractComponent from './AbstractComponent';
import AbstractView from '../view/AbstractView';
import AbstractControl from '../control/AbstractControl';


abstract class AbstractComponentSet extends AbstractComponent {
    state = null;
    _componentMap: { controls: AbstractControl[], components: typeof AbstractComponent[] } = {
        controls: [], components: [],
    };

    abstract getComponentClass(index): typeof AbstractComponent;

    getSubComponent(control: AbstractControl): typeof AbstractComponent {
        return this._componentMap.components[this._componentMap.controls.indexOf(control)];
    }

    register(controls: AbstractControl[], view: typeof AbstractView) {
        super.register(controls, view);

        for (let i = 0; i < controls.length; i++) {
            let control = controls[i];
            // create/add component
            let component = this.getComponentClass(i);
            component.parent = this.constructor as typeof AbstractComponent;
            this._componentMap.controls.push(control);
            this._componentMap.components.push(component);
            // register component
            component.instance.register([control], view);
        }
    }

    updateControlState(control: AbstractControl) {
        // pass on state to corresponding control
        this.getSubComponent(control).instance.updateControlState(control);
    }

    onControlInput(control: AbstractControl, state: Object) {
        // pass on midi to corresponding control
        this.getSubComponent(control).instance.onControlInput(control, state);
    }
}


export default AbstractComponentSet;
