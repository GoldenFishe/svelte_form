
(function(l, r) { if (l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (window.location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.getElementsByTagName('head')[0].appendChild(r) })(window.document);
var app = (function () {
    'use strict';

    function noop() { }
    function assign(tar, src) {
        // @ts-ignore
        for (const k in src)
            tar[k] = src[k];
        return tar;
    }
    function add_location(element, file, line, column, char) {
        element.__svelte_meta = {
            loc: { file, line, column, char }
        };
    }
    function run(fn) {
        return fn();
    }
    function blank_object() {
        return Object.create(null);
    }
    function run_all(fns) {
        fns.forEach(run);
    }
    function is_function(thing) {
        return typeof thing === 'function';
    }
    function safe_not_equal(a, b) {
        return a != a ? b == b : a !== b || ((a && typeof a === 'object') || typeof a === 'function');
    }
    function is_empty(obj) {
        return Object.keys(obj).length === 0;
    }
    function create_slot(definition, ctx, $$scope, fn) {
        if (definition) {
            const slot_ctx = get_slot_context(definition, ctx, $$scope, fn);
            return definition[0](slot_ctx);
        }
    }
    function get_slot_context(definition, ctx, $$scope, fn) {
        return definition[1] && fn
            ? assign($$scope.ctx.slice(), definition[1](fn(ctx)))
            : $$scope.ctx;
    }
    function get_slot_changes(definition, $$scope, dirty, fn) {
        if (definition[2] && fn) {
            const lets = definition[2](fn(dirty));
            if ($$scope.dirty === undefined) {
                return lets;
            }
            if (typeof lets === 'object') {
                const merged = [];
                const len = Math.max($$scope.dirty.length, lets.length);
                for (let i = 0; i < len; i += 1) {
                    merged[i] = $$scope.dirty[i] | lets[i];
                }
                return merged;
            }
            return $$scope.dirty | lets;
        }
        return $$scope.dirty;
    }
    function update_slot(slot, slot_definition, ctx, $$scope, dirty, get_slot_changes_fn, get_slot_context_fn) {
        const slot_changes = get_slot_changes(slot_definition, $$scope, dirty, get_slot_changes_fn);
        if (slot_changes) {
            const slot_context = get_slot_context(slot_definition, ctx, $$scope, get_slot_context_fn);
            slot.p(slot_context, slot_changes);
        }
    }

    function append(target, node) {
        target.appendChild(node);
    }
    function insert(target, node, anchor) {
        target.insertBefore(node, anchor || null);
    }
    function detach(node) {
        node.parentNode.removeChild(node);
    }
    function element(name) {
        return document.createElement(name);
    }
    function text(data) {
        return document.createTextNode(data);
    }
    function space() {
        return text(' ');
    }
    function listen(node, event, handler, options) {
        node.addEventListener(event, handler, options);
        return () => node.removeEventListener(event, handler, options);
    }
    function prevent_default(fn) {
        return function (event) {
            event.preventDefault();
            // @ts-ignore
            return fn.call(this, event);
        };
    }
    function attr(node, attribute, value) {
        if (value == null)
            node.removeAttribute(attribute);
        else if (node.getAttribute(attribute) !== value)
            node.setAttribute(attribute, value);
    }
    function children(element) {
        return Array.from(element.childNodes);
    }
    function toggle_class(element, name, toggle) {
        element.classList[toggle ? 'add' : 'remove'](name);
    }
    function custom_event(type, detail) {
        const e = document.createEvent('CustomEvent');
        e.initCustomEvent(type, false, false, detail);
        return e;
    }

    let current_component;
    function set_current_component(component) {
        current_component = component;
    }
    function get_current_component() {
        if (!current_component)
            throw new Error('Function called outside component initialization');
        return current_component;
    }
    function onMount(fn) {
        get_current_component().$$.on_mount.push(fn);
    }
    // TODO figure out if we still want to support
    // shorthand events, or if we want to implement
    // a real bubbling mechanism
    function bubble(component, event) {
        const callbacks = component.$$.callbacks[event.type];
        if (callbacks) {
            callbacks.slice().forEach(fn => fn(event));
        }
    }

    const dirty_components = [];
    const binding_callbacks = [];
    const render_callbacks = [];
    const flush_callbacks = [];
    const resolved_promise = Promise.resolve();
    let update_scheduled = false;
    function schedule_update() {
        if (!update_scheduled) {
            update_scheduled = true;
            resolved_promise.then(flush);
        }
    }
    function add_render_callback(fn) {
        render_callbacks.push(fn);
    }
    function add_flush_callback(fn) {
        flush_callbacks.push(fn);
    }
    let flushing = false;
    const seen_callbacks = new Set();
    function flush() {
        if (flushing)
            return;
        flushing = true;
        do {
            // first, call beforeUpdate functions
            // and update components
            for (let i = 0; i < dirty_components.length; i += 1) {
                const component = dirty_components[i];
                set_current_component(component);
                update(component.$$);
            }
            set_current_component(null);
            dirty_components.length = 0;
            while (binding_callbacks.length)
                binding_callbacks.pop()();
            // then, once components are updated, call
            // afterUpdate functions. This may cause
            // subsequent updates...
            for (let i = 0; i < render_callbacks.length; i += 1) {
                const callback = render_callbacks[i];
                if (!seen_callbacks.has(callback)) {
                    // ...so guard against infinite loops
                    seen_callbacks.add(callback);
                    callback();
                }
            }
            render_callbacks.length = 0;
        } while (dirty_components.length);
        while (flush_callbacks.length) {
            flush_callbacks.pop()();
        }
        update_scheduled = false;
        flushing = false;
        seen_callbacks.clear();
    }
    function update($$) {
        if ($$.fragment !== null) {
            $$.update();
            run_all($$.before_update);
            const dirty = $$.dirty;
            $$.dirty = [-1];
            $$.fragment && $$.fragment.p($$.ctx, dirty);
            $$.after_update.forEach(add_render_callback);
        }
    }
    const outroing = new Set();
    let outros;
    function transition_in(block, local) {
        if (block && block.i) {
            outroing.delete(block);
            block.i(local);
        }
    }
    function transition_out(block, local, detach, callback) {
        if (block && block.o) {
            if (outroing.has(block))
                return;
            outroing.add(block);
            outros.c.push(() => {
                outroing.delete(block);
                if (callback) {
                    if (detach)
                        block.d(1);
                    callback();
                }
            });
            block.o(local);
        }
    }

    function bind(component, name, callback) {
        const index = component.$$.props[name];
        if (index !== undefined) {
            component.$$.bound[index] = callback;
            callback(component.$$.ctx[index]);
        }
    }
    function create_component(block) {
        block && block.c();
    }
    function mount_component(component, target, anchor) {
        const { fragment, on_mount, on_destroy, after_update } = component.$$;
        fragment && fragment.m(target, anchor);
        // onMount happens before the initial afterUpdate
        add_render_callback(() => {
            const new_on_destroy = on_mount.map(run).filter(is_function);
            if (on_destroy) {
                on_destroy.push(...new_on_destroy);
            }
            else {
                // Edge case - component was destroyed immediately,
                // most likely as a result of a binding initialising
                run_all(new_on_destroy);
            }
            component.$$.on_mount = [];
        });
        after_update.forEach(add_render_callback);
    }
    function destroy_component(component, detaching) {
        const $$ = component.$$;
        if ($$.fragment !== null) {
            run_all($$.on_destroy);
            $$.fragment && $$.fragment.d(detaching);
            // TODO null out other refs, including component.$$ (but need to
            // preserve final state?)
            $$.on_destroy = $$.fragment = null;
            $$.ctx = [];
        }
    }
    function make_dirty(component, i) {
        if (component.$$.dirty[0] === -1) {
            dirty_components.push(component);
            schedule_update();
            component.$$.dirty.fill(0);
        }
        component.$$.dirty[(i / 31) | 0] |= (1 << (i % 31));
    }
    function init(component, options, instance, create_fragment, not_equal, props, dirty = [-1]) {
        const parent_component = current_component;
        set_current_component(component);
        const prop_values = options.props || {};
        const $$ = component.$$ = {
            fragment: null,
            ctx: null,
            // state
            props,
            update: noop,
            not_equal,
            bound: blank_object(),
            // lifecycle
            on_mount: [],
            on_destroy: [],
            before_update: [],
            after_update: [],
            context: new Map(parent_component ? parent_component.$$.context : []),
            // everything else
            callbacks: blank_object(),
            dirty,
            skip_bound: false
        };
        let ready = false;
        $$.ctx = instance
            ? instance(component, prop_values, (i, ret, ...rest) => {
                const value = rest.length ? rest[0] : ret;
                if ($$.ctx && not_equal($$.ctx[i], $$.ctx[i] = value)) {
                    if (!$$.skip_bound && $$.bound[i])
                        $$.bound[i](value);
                    if (ready)
                        make_dirty(component, i);
                }
                return ret;
            })
            : [];
        $$.update();
        ready = true;
        run_all($$.before_update);
        // `false` as a special case of no DOM component
        $$.fragment = create_fragment ? create_fragment($$.ctx) : false;
        if (options.target) {
            if (options.hydrate) {
                const nodes = children(options.target);
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.l(nodes);
                nodes.forEach(detach);
            }
            else {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.c();
            }
            if (options.intro)
                transition_in(component.$$.fragment);
            mount_component(component, options.target, options.anchor);
            flush();
        }
        set_current_component(parent_component);
    }
    /**
     * Base class for Svelte components. Used when dev=false.
     */
    class SvelteComponent {
        $destroy() {
            destroy_component(this, 1);
            this.$destroy = noop;
        }
        $on(type, callback) {
            const callbacks = (this.$$.callbacks[type] || (this.$$.callbacks[type] = []));
            callbacks.push(callback);
            return () => {
                const index = callbacks.indexOf(callback);
                if (index !== -1)
                    callbacks.splice(index, 1);
            };
        }
        $set($$props) {
            if (this.$$set && !is_empty($$props)) {
                this.$$.skip_bound = true;
                this.$$set($$props);
                this.$$.skip_bound = false;
            }
        }
    }

    function dispatch_dev(type, detail) {
        document.dispatchEvent(custom_event(type, Object.assign({ version: '3.31.2' }, detail)));
    }
    function append_dev(target, node) {
        dispatch_dev('SvelteDOMInsert', { target, node });
        append(target, node);
    }
    function insert_dev(target, node, anchor) {
        dispatch_dev('SvelteDOMInsert', { target, node, anchor });
        insert(target, node, anchor);
    }
    function detach_dev(node) {
        dispatch_dev('SvelteDOMRemove', { node });
        detach(node);
    }
    function listen_dev(node, event, handler, options, has_prevent_default, has_stop_propagation) {
        const modifiers = options === true ? ['capture'] : options ? Array.from(Object.keys(options)) : [];
        if (has_prevent_default)
            modifiers.push('preventDefault');
        if (has_stop_propagation)
            modifiers.push('stopPropagation');
        dispatch_dev('SvelteDOMAddEventListener', { node, event, handler, modifiers });
        const dispose = listen(node, event, handler, options);
        return () => {
            dispatch_dev('SvelteDOMRemoveEventListener', { node, event, handler, modifiers });
            dispose();
        };
    }
    function attr_dev(node, attribute, value) {
        attr(node, attribute, value);
        if (value == null)
            dispatch_dev('SvelteDOMRemoveAttribute', { node, attribute });
        else
            dispatch_dev('SvelteDOMSetAttribute', { node, attribute, value });
    }
    function prop_dev(node, property, value) {
        node[property] = value;
        dispatch_dev('SvelteDOMSetProperty', { node, property, value });
    }
    function set_data_dev(text, data) {
        data = '' + data;
        if (text.wholeText === data)
            return;
        dispatch_dev('SvelteDOMSetData', { node: text, data });
        text.data = data;
    }
    function validate_slots(name, slot, keys) {
        for (const slot_key of Object.keys(slot)) {
            if (!~keys.indexOf(slot_key)) {
                console.warn(`<${name}> received an unexpected slot "${slot_key}".`);
            }
        }
    }
    /**
     * Base class for Svelte components with some minor dev-enhancements. Used when dev=true.
     */
    class SvelteComponentDev extends SvelteComponent {
        constructor(options) {
            if (!options || (!options.target && !options.$$inline)) {
                throw new Error("'target' is a required option");
            }
            super();
        }
        $destroy() {
            super.$destroy();
            this.$destroy = () => {
                console.warn('Component was already destroyed'); // eslint-disable-line no-console
            };
        }
        $capture_state() { }
        $inject_state() { }
    }

    /* src/Components/Input.svelte generated by Svelte v3.31.2 */
    const file = "src/Components/Input.svelte";

    // (59:4) {#if initialType === 'password' && value}
    function create_if_block(ctx) {
    	let span;

    	let t_value = (/*isVisiblePassword*/ ctx[9]
    	? "Скрыть пароль"
    	: "Показать пароль") + "";

    	let t;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			span = element("span");
    			t = text(t_value);
    			add_location(span, file, 59, 8, 1621);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, span, anchor);
    			append_dev(span, t);

    			if (!mounted) {
    				dispose = listen_dev(span, "click", /*toggleVisiblePassword*/ ctx[14], false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*isVisiblePassword*/ 512 && t_value !== (t_value = (/*isVisiblePassword*/ ctx[9]
    			? "Скрыть пароль"
    			: "Показать пароль") + "")) set_data_dev(t, t_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(span);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block.name,
    		type: "if",
    		source: "(59:4) {#if initialType === 'password' && value}",
    		ctx
    	});

    	return block;
    }

    function create_fragment(ctx) {
    	let label_1;
    	let span;
    	let t0;
    	let t1;
    	let input;
    	let t2;
    	let mounted;
    	let dispose;
    	let if_block = /*initialType*/ ctx[8] === "password" && /*value*/ ctx[1] && create_if_block(ctx);

    	const block = {
    		c: function create() {
    			label_1 = element("label");
    			span = element("span");
    			t0 = text(/*label*/ ctx[3]);
    			t1 = space();
    			input = element("input");
    			t2 = space();
    			if (if_block) if_block.c();
    			attr_dev(span, "class", "label svelte-13djpdc");
    			add_location(span, file, 46, 4, 1252);
    			attr_dev(input, "type", /*type*/ ctx[0]);
    			attr_dev(input, "id", /*id*/ ctx[4]);
    			input.value = /*value*/ ctx[1];
    			attr_dev(input, "pattern", /*pattern*/ ctx[7]);
    			attr_dev(input, "minlength", /*minlength*/ ctx[5]);
    			attr_dev(input, "maxlength", /*maxlength*/ ctx[6]);
    			input.required = /*required*/ ctx[2];
    			attr_dev(input, "title", /*title*/ ctx[11]);
    			attr_dev(input, "class", "svelte-13djpdc");
    			toggle_class(input, "invalid", !/*state*/ ctx[10].valid && /*state*/ ctx[10].touched);
    			add_location(input, file, 47, 4, 1291);
    			attr_dev(label_1, "class", "svelte-13djpdc");
    			add_location(label_1, file, 45, 0, 1240);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, label_1, anchor);
    			append_dev(label_1, span);
    			append_dev(span, t0);
    			append_dev(label_1, t1);
    			append_dev(label_1, input);
    			append_dev(label_1, t2);
    			if (if_block) if_block.m(label_1, null);

    			if (!mounted) {
    				dispose = [
    					listen_dev(input, "input", /*onInput*/ ctx[12], false, false, false),
    					listen_dev(input, "blur", /*validate*/ ctx[13], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*label*/ 8) set_data_dev(t0, /*label*/ ctx[3]);

    			if (dirty & /*type*/ 1) {
    				attr_dev(input, "type", /*type*/ ctx[0]);
    			}

    			if (dirty & /*id*/ 16) {
    				attr_dev(input, "id", /*id*/ ctx[4]);
    			}

    			if (dirty & /*value*/ 2 && input.value !== /*value*/ ctx[1]) {
    				prop_dev(input, "value", /*value*/ ctx[1]);
    			}

    			if (dirty & /*pattern*/ 128) {
    				attr_dev(input, "pattern", /*pattern*/ ctx[7]);
    			}

    			if (dirty & /*minlength*/ 32) {
    				attr_dev(input, "minlength", /*minlength*/ ctx[5]);
    			}

    			if (dirty & /*maxlength*/ 64) {
    				attr_dev(input, "maxlength", /*maxlength*/ ctx[6]);
    			}

    			if (dirty & /*required*/ 4) {
    				prop_dev(input, "required", /*required*/ ctx[2]);
    			}

    			if (dirty & /*state*/ 1024) {
    				toggle_class(input, "invalid", !/*state*/ ctx[10].valid && /*state*/ ctx[10].touched);
    			}

    			if (/*initialType*/ ctx[8] === "password" && /*value*/ ctx[1]) {
    				if (if_block) {
    					if_block.p(ctx, dirty);
    				} else {
    					if_block = create_if_block(ctx);
    					if_block.c();
    					if_block.m(label_1, null);
    				}
    			} else if (if_block) {
    				if_block.d(1);
    				if_block = null;
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(label_1);
    			if (if_block) if_block.d();
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Input", slots, []);

    	onMount(() => {
    		$$invalidate(8, initialType = type);
    	});

    	let { type = "text" } = $$props;
    	let { required = false } = $$props;
    	let { value = "" } = $$props;
    	let { label = "" } = $$props;
    	let { id } = $$props;
    	let { minlength } = $$props;
    	let { maxlength } = $$props;
    	let { pattern } = $$props;
    	let initialType = type;
    	let isVisiblePassword = false;

    	let title = minlength && maxlength
    	? `От ${minlength} до ${maxlength} символов`
    	: "";

    	let state = { touched: false, valid: false };

    	function onInput(event) {
    		$$invalidate(10, state.touched = true, state);
    		$$invalidate(1, value = event.target.value);

    		if (!value && isVisiblePassword) {
    			$$invalidate(9, isVisiblePassword = false);
    			$$invalidate(0, type = initialType);
    		}
    	}

    	function validate() {
    		let passedPatternValidate = true;
    		let passedMinLength = true;
    		let passedMaxLength = true;
    		if (pattern) passedPatternValidate = new RegExp(pattern).test(value);
    		if (minlength) passedMinLength = value.length >= minlength;
    		if (maxlength) passedMaxLength = value.length <= maxlength;
    		$$invalidate(10, state.valid = passedPatternValidate && passedMinLength && passedMaxLength, state);
    	}

    	function toggleVisiblePassword() {
    		$$invalidate(9, isVisiblePassword = !isVisiblePassword);
    		$$invalidate(0, type = isVisiblePassword ? "text" : "password");
    	}

    	const writable_props = [
    		"type",
    		"required",
    		"value",
    		"label",
    		"id",
    		"minlength",
    		"maxlength",
    		"pattern"
    	];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Input> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ("type" in $$props) $$invalidate(0, type = $$props.type);
    		if ("required" in $$props) $$invalidate(2, required = $$props.required);
    		if ("value" in $$props) $$invalidate(1, value = $$props.value);
    		if ("label" in $$props) $$invalidate(3, label = $$props.label);
    		if ("id" in $$props) $$invalidate(4, id = $$props.id);
    		if ("minlength" in $$props) $$invalidate(5, minlength = $$props.minlength);
    		if ("maxlength" in $$props) $$invalidate(6, maxlength = $$props.maxlength);
    		if ("pattern" in $$props) $$invalidate(7, pattern = $$props.pattern);
    	};

    	$$self.$capture_state = () => ({
    		onMount,
    		type,
    		required,
    		value,
    		label,
    		id,
    		minlength,
    		maxlength,
    		pattern,
    		initialType,
    		isVisiblePassword,
    		title,
    		state,
    		onInput,
    		validate,
    		toggleVisiblePassword
    	});

    	$$self.$inject_state = $$props => {
    		if ("type" in $$props) $$invalidate(0, type = $$props.type);
    		if ("required" in $$props) $$invalidate(2, required = $$props.required);
    		if ("value" in $$props) $$invalidate(1, value = $$props.value);
    		if ("label" in $$props) $$invalidate(3, label = $$props.label);
    		if ("id" in $$props) $$invalidate(4, id = $$props.id);
    		if ("minlength" in $$props) $$invalidate(5, minlength = $$props.minlength);
    		if ("maxlength" in $$props) $$invalidate(6, maxlength = $$props.maxlength);
    		if ("pattern" in $$props) $$invalidate(7, pattern = $$props.pattern);
    		if ("initialType" in $$props) $$invalidate(8, initialType = $$props.initialType);
    		if ("isVisiblePassword" in $$props) $$invalidate(9, isVisiblePassword = $$props.isVisiblePassword);
    		if ("title" in $$props) $$invalidate(11, title = $$props.title);
    		if ("state" in $$props) $$invalidate(10, state = $$props.state);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		type,
    		value,
    		required,
    		label,
    		id,
    		minlength,
    		maxlength,
    		pattern,
    		initialType,
    		isVisiblePassword,
    		state,
    		title,
    		onInput,
    		validate,
    		toggleVisiblePassword
    	];
    }

    class Input extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(this, options, instance, create_fragment, safe_not_equal, {
    			type: 0,
    			required: 2,
    			value: 1,
    			label: 3,
    			id: 4,
    			minlength: 5,
    			maxlength: 6,
    			pattern: 7
    		});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Input",
    			options,
    			id: create_fragment.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*id*/ ctx[4] === undefined && !("id" in props)) {
    			console.warn("<Input> was created without expected prop 'id'");
    		}

    		if (/*minlength*/ ctx[5] === undefined && !("minlength" in props)) {
    			console.warn("<Input> was created without expected prop 'minlength'");
    		}

    		if (/*maxlength*/ ctx[6] === undefined && !("maxlength" in props)) {
    			console.warn("<Input> was created without expected prop 'maxlength'");
    		}

    		if (/*pattern*/ ctx[7] === undefined && !("pattern" in props)) {
    			console.warn("<Input> was created without expected prop 'pattern'");
    		}
    	}

    	get type() {
    		throw new Error("<Input>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set type(value) {
    		throw new Error("<Input>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get required() {
    		throw new Error("<Input>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set required(value) {
    		throw new Error("<Input>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get value() {
    		throw new Error("<Input>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set value(value) {
    		throw new Error("<Input>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get label() {
    		throw new Error("<Input>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set label(value) {
    		throw new Error("<Input>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get id() {
    		throw new Error("<Input>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set id(value) {
    		throw new Error("<Input>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get minlength() {
    		throw new Error("<Input>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set minlength(value) {
    		throw new Error("<Input>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get maxlength() {
    		throw new Error("<Input>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set maxlength(value) {
    		throw new Error("<Input>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get pattern() {
    		throw new Error("<Input>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set pattern(value) {
    		throw new Error("<Input>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/Components/Button.svelte generated by Svelte v3.31.2 */

    const file$1 = "src/Components/Button.svelte";

    function create_fragment$1(ctx) {
    	let button;
    	let current;
    	let mounted;
    	let dispose;
    	const default_slot_template = /*#slots*/ ctx[2].default;
    	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[1], null);

    	const block = {
    		c: function create() {
    			button = element("button");
    			if (default_slot) default_slot.c();
    			attr_dev(button, "type", /*type*/ ctx[0]);
    			attr_dev(button, "class", "svelte-d7lp2d");
    			add_location(button, file$1, 3, 0, 57);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, button, anchor);

    			if (default_slot) {
    				default_slot.m(button, null);
    			}

    			current = true;

    			if (!mounted) {
    				dispose = listen_dev(button, "click", /*click_handler*/ ctx[3], false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (default_slot) {
    				if (default_slot.p && dirty & /*$$scope*/ 2) {
    					update_slot(default_slot, default_slot_template, ctx, /*$$scope*/ ctx[1], dirty, null, null);
    				}
    			}

    			if (!current || dirty & /*type*/ 1) {
    				attr_dev(button, "type", /*type*/ ctx[0]);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(default_slot, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(default_slot, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(button);
    			if (default_slot) default_slot.d(detaching);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$1.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$1($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Button", slots, ['default']);
    	let { type = "button" } = $$props;
    	const writable_props = ["type"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Button> was created with unknown prop '${key}'`);
    	});

    	function click_handler(event) {
    		bubble($$self, event);
    	}

    	$$self.$$set = $$props => {
    		if ("type" in $$props) $$invalidate(0, type = $$props.type);
    		if ("$$scope" in $$props) $$invalidate(1, $$scope = $$props.$$scope);
    	};

    	$$self.$capture_state = () => ({ type });

    	$$self.$inject_state = $$props => {
    		if ("type" in $$props) $$invalidate(0, type = $$props.type);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [type, $$scope, slots, click_handler];
    }

    class Button extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$1, create_fragment$1, safe_not_equal, { type: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Button",
    			options,
    			id: create_fragment$1.name
    		});
    	}

    	get type() {
    		throw new Error("<Button>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set type(value) {
    		throw new Error("<Button>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/Views/SignInForm.svelte generated by Svelte v3.31.2 */
    const file$2 = "src/Views/SignInForm.svelte";

    // (49:8) <Button type="submit">
    function create_default_slot(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text("Sign In");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot.name,
    		type: "slot",
    		source: "(49:8) <Button type=\\\"submit\\\">",
    		ctx
    	});

    	return block;
    }

    function create_fragment$2(ctx) {
    	let main;
    	let h2;
    	let t1;
    	let form_1;
    	let input0;
    	let updating_value;
    	let t2;
    	let input1;
    	let updating_value_1;
    	let t3;
    	let button;
    	let current;
    	let mounted;
    	let dispose;

    	function input0_value_binding(value) {
    		/*input0_value_binding*/ ctx[3].call(null, value);
    	}

    	let input0_props = {
    		type: "email",
    		label: "Email",
    		minlength: /*validation*/ ctx[1].email.minlength,
    		maxlength: /*validation*/ ctx[1].email.maxlength,
    		pattern: `[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$`,
    		required: true,
    		id: "sign-in-email"
    	};

    	if (/*form*/ ctx[0].email !== void 0) {
    		input0_props.value = /*form*/ ctx[0].email;
    	}

    	input0 = new Input({ props: input0_props, $$inline: true });
    	binding_callbacks.push(() => bind(input0, "value", input0_value_binding));

    	function input1_value_binding(value) {
    		/*input1_value_binding*/ ctx[4].call(null, value);
    	}

    	let input1_props = {
    		type: "password",
    		label: "Password",
    		minlength: /*validation*/ ctx[1].password.minlength,
    		maxlength: /*validation*/ ctx[1].password.maxlength,
    		required: true,
    		id: "sign-in-password"
    	};

    	if (/*form*/ ctx[0].password !== void 0) {
    		input1_props.value = /*form*/ ctx[0].password;
    	}

    	input1 = new Input({ props: input1_props, $$inline: true });
    	binding_callbacks.push(() => bind(input1, "value", input1_value_binding));

    	button = new Button({
    			props: {
    				type: "submit",
    				$$slots: { default: [create_default_slot] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			main = element("main");
    			h2 = element("h2");
    			h2.textContent = "Sign In";
    			t1 = space();
    			form_1 = element("form");
    			create_component(input0.$$.fragment);
    			t2 = space();
    			create_component(input1.$$.fragment);
    			t3 = space();
    			create_component(button.$$.fragment);
    			attr_dev(h2, "class", "h2 svelte-fbfim0");
    			add_location(h2, file$2, 31, 4, 766);
    			form_1.noValidate = "novalidate";
    			attr_dev(form_1, "accept-charset", "UTF-8");
    			attr_dev(form_1, "class", "svelte-fbfim0");
    			add_location(form_1, file$2, 32, 4, 798);
    			add_location(main, file$2, 30, 0, 755);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, main, anchor);
    			append_dev(main, h2);
    			append_dev(main, t1);
    			append_dev(main, form_1);
    			mount_component(input0, form_1, null);
    			append_dev(form_1, t2);
    			mount_component(input1, form_1, null);
    			append_dev(form_1, t3);
    			mount_component(button, form_1, null);
    			current = true;

    			if (!mounted) {
    				dispose = listen_dev(form_1, "submit", prevent_default(/*onSubmit*/ ctx[2]), false, true, false);
    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			const input0_changes = {};

    			if (!updating_value && dirty & /*form*/ 1) {
    				updating_value = true;
    				input0_changes.value = /*form*/ ctx[0].email;
    				add_flush_callback(() => updating_value = false);
    			}

    			input0.$set(input0_changes);
    			const input1_changes = {};

    			if (!updating_value_1 && dirty & /*form*/ 1) {
    				updating_value_1 = true;
    				input1_changes.value = /*form*/ ctx[0].password;
    				add_flush_callback(() => updating_value_1 = false);
    			}

    			input1.$set(input1_changes);
    			const button_changes = {};

    			if (dirty & /*$$scope*/ 64) {
    				button_changes.$$scope = { dirty, ctx };
    			}

    			button.$set(button_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(input0.$$.fragment, local);
    			transition_in(input1.$$.fragment, local);
    			transition_in(button.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(input0.$$.fragment, local);
    			transition_out(input1.$$.fragment, local);
    			transition_out(button.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(main);
    			destroy_component(input0);
    			destroy_component(input1);
    			destroy_component(button);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$2.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$2($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("SignInForm", slots, []);
    	const form = { email: "", password: "" };

    	const validation = {
    		email: { minlength: 5, maxlength: 50 },
    		password: { minlength: 6, maxlength: 25 }
    	};

    	function validate(type, value) {
    		return value.length >= validation[type].minlength && value.length <= validation[type].maxlength;
    	}

    	function onSubmit() {
    		const isValidEmail = validate("email", form.email);
    		const isValidPassword = validate("password", form.password);

    		if (isValidEmail && isValidPassword) {
    			alert(`Welcome ${form.email}!`);
    			$$invalidate(0, form.email = "", form);
    			$$invalidate(0, form.password = "", form);
    		}
    	}

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<SignInForm> was created with unknown prop '${key}'`);
    	});

    	function input0_value_binding(value) {
    		form.email = value;
    		$$invalidate(0, form);
    	}

    	function input1_value_binding(value) {
    		form.password = value;
    		$$invalidate(0, form);
    	}

    	$$self.$capture_state = () => ({
    		Input,
    		Button,
    		form,
    		validation,
    		validate,
    		onSubmit
    	});

    	return [form, validation, onSubmit, input0_value_binding, input1_value_binding];
    }

    class SignInForm extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$2, create_fragment$2, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "SignInForm",
    			options,
    			id: create_fragment$2.name
    		});
    	}
    }

    /* src/App.svelte generated by Svelte v3.31.2 */
    const file$3 = "src/App.svelte";

    function create_fragment$3(ctx) {
    	let main;
    	let h1;
    	let t1;
    	let signinform;
    	let current;
    	signinform = new SignInForm({ $$inline: true });

    	const block = {
    		c: function create() {
    			main = element("main");
    			h1 = element("h1");
    			h1.textContent = "Welcome! 🧔🏻👩🏽‍🦱";
    			t1 = space();
    			create_component(signinform.$$.fragment);
    			attr_dev(h1, "class", "h1");
    			add_location(h1, file$3, 5, 4, 87);
    			add_location(main, file$3, 4, 0, 76);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, main, anchor);
    			append_dev(main, h1);
    			append_dev(main, t1);
    			mount_component(signinform, main, null);
    			current = true;
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;
    			transition_in(signinform.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(signinform.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(main);
    			destroy_component(signinform);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$3.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$3($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("App", slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<App> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({ SignInForm });
    	return [];
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$3, create_fragment$3, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "App",
    			options,
    			id: create_fragment$3.name
    		});
    	}
    }

    const app = new App({
        target: document.body
    });

    return app;

}());
//# sourceMappingURL=bundle.js.map
