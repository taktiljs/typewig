import { MidiMessage, SysexMessage } from '../midi';
import { AbstractComponent } from '../component';
import { AbstractControl } from '../control';
import session from '../../session';

interface AbstractView {
    [key: string]: { component: typeof AbstractComponent, controls: AbstractControl[], mode?: string };
}

abstract class AbstractView {
    static parent: typeof AbstractView;
    private static _instance: AbstractView;
    private static _componentMap: { [mode: string]: { controls: AbstractControl[], components: typeof AbstractComponent[] } };

    static get instance() {
        // inheritance safe singleton pattern (each child class will have its own singleton)
        const View = this as any as { new (): AbstractView, _instance: AbstractView };
        let instance = View._instance;

        if (instance instanceof View) return instance;
        // force every child class to create/use its own _componentMap object, instead of sharing one.
        this._componentMap = {};
        instance = new View();
        View._instance = instance;

        return instance;
    }

    static getComponent(control: AbstractControl, mode: string) {
        const instance = this.instance;
        if (this._componentMap[mode] === undefined) return;
        const componentMapIndex = this._componentMap[mode].controls.indexOf(control);
        if (componentMapIndex === -1) return;
        return this._componentMap[mode].components[componentMapIndex];
    }

    static associateControl(control: AbstractControl) {
        const instance = this.instance;
        // check view modes in order for component/control registration
        for (let activeMode of session.activeModes) {
            if (!this._componentMap[activeMode]) continue;  // mode not used in view
            const component: typeof AbstractComponent = this.getComponent(control, activeMode);
            if (component) { 
                control.activeComponent = component;
                return;
            }
        }
        // component not found in view? send to parent
        if (this.parent) {
            this.parent.associateControl(control);
        } else {
            // no parent? no component to connect to
            control.activeComponent = null;
        }
    }

    static registerComponent(component: typeof AbstractComponent, controls: AbstractControl[], mode = '__BASE__') {
        // register controls w/ component
        component.instance.register(controls, this);
        for (let control of controls as AbstractControl[]) {
            // register control with view/mode
            if (!this._componentMap[mode]) this._componentMap[mode] = { controls: [], components: [] };

            // if control already registered in view mode, throw error
            if (this._componentMap[mode].controls.indexOf(control) > -1) throw Error('Duplicate Control registration in view mode.');

            // add control and component pair to component map
            this._componentMap[mode].controls.push(control);
            this._componentMap[mode].components.push(component);
        }
    }

    static onRegister() {
        const instance = this.instance;
        Object.getOwnPropertyNames(instance).map(key => {
            const { component, controls, mode } = instance[key];
            this.registerComponent(component, controls, mode);
        });
    }

    // view should be instantiated through `get instance` method, not `new`
    protected constructor() {}
}

export default AbstractView;