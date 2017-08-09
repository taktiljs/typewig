import { Component } from '../component';
import { Control } from '../control';

interface View {
    [key: string]: Component | Component[] | (() => Component | Component[]);
}

class View {
    private static _componentMap: {
        [mode: string]: {
            controls: Control[];
            components: Component[];
        };
    };

    static parent: typeof View | string;

    static getParent(): typeof View | undefined {
        if (typeof this.parent === 'string') return session.getView(this.parent);
        return this.parent;
    }

    static getComponent(control: Control, mode: string): Component | null {
        // check in current view
        if (this._componentMap[mode] !== undefined) {
            const componentMapIndex = this._componentMap[mode].controls.indexOf(control);
            if (componentMapIndex !== -1) {
                return this._componentMap[mode].components[componentMapIndex];
            }
        }

        // component not found in view? check in parent
        const parent = this.getParent();
        if (parent) return parent.getComponent(control, mode);

        // not in current view, no parent to check? return null
        return null;
    }

    static connectControl(control: Control) {
        // check view modes in order for component/control registration
        for (const activeMode of session.getActiveModes()) {
            const component = this.getComponent(control, activeMode);
            // only set the component when it has changed
            if (control.activeComponent !== component) control.activeComponent = component;
            // if component is not null, we're done looking
            if (component) return;
        }
    }

    static init() {
        const instance = new this();
        // give each subclass its own componentMap
        this._componentMap = {};

        Object.getOwnPropertyNames(instance).map(key => {
            let value = instance[key];
            value = typeof value === 'function' ? value() : value;
            const components = value instanceof Array ? value : [value];
            for (let i = 0; i < components.length; i += 1) {
                const component = components[i];
                const isSingleComponent = components.length === 1;
                // skip non-component properties
                if (component instanceof Component === false) continue;
                // set component name and view
                component.name = isSingleComponent ? key : `${key}[${i}]`;
                // register components and controls in view
                const { controls, mode } = component;
                for (const control of controls as Control[]) {
                    // register control with view/mode
                    if (!this._componentMap[mode])
                        this._componentMap[mode] = {
                            controls: [],
                            components: [],
                        };

                    // if control already registered in view mode, throw error
                    if (this._componentMap[mode].controls.indexOf(control) > -1)
                        throw Error(
                            `Duplicate Control "${control.name}" registration in view mode.`
                        );

                    // add control and component pair to component map
                    this._componentMap[mode].controls.push(control);
                    this._componentMap[mode].components.push(component);
                    // initialize component
                    if (component.onInit) component.onInit();
                }
            }
        });
    }

    // view should be instantiated through `get instance` method, not `new`
    protected constructor() {}
}

export default View;