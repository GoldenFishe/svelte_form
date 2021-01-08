<script lang="ts">
    import {onMount} from "svelte";

    onMount(() => {
        initialType = type;
    })

    type Type = 'text' | 'email' | 'password';

    export let type: Type = 'text';
    export let required: boolean = false;
    export let value: string = '';
    export let label: string = '';
    export let id: string;
    export let minlength: number;
    export let maxlength: number;
    export let pattern: string;

    let initialType: Type = type;
    let isVisiblePassword: boolean = false;
    let title: string = minlength && maxlength ? `From ${minlength} to ${maxlength} characters` : ''
    let state: { touched: boolean, valid: boolean } = {
        touched: false,
        valid: false
    }

    function onInput(event): void {
        state.touched = true;
        value = event.target.value;
        if (!value && isVisiblePassword) {
            isVisiblePassword = false;
            type = initialType;
        }
    }

    function validate() {
        let passedPatternValidate = true;
        let passedMinLength = true;
        let passedMaxLength = true;
        if (pattern) passedPatternValidate = new RegExp(pattern).test(value);
        if (minlength) passedMinLength = value.length >= minlength;
        if (maxlength) passedMaxLength = value.length <= maxlength;
        state.valid = passedPatternValidate && passedMinLength && passedMaxLength;
    }

    function toggleVisiblePassword(): void {
        isVisiblePassword = !isVisiblePassword;
        type = isVisiblePassword ? 'text' : 'password';
    }
</script>

<label>
    <span class="label">{label}</span>
    <input {type}
           {id}
           {value}
           {pattern}
           {minlength}
           {maxlength}
           {required}
           {title}
           placeholder={title}
           class:invalid={!state.valid && state.touched}
           class="input"
           on:input={onInput}
           on:blur={validate}/>
    {#if initialType === 'password' && value}
        {#if isVisiblePassword}
            <img src="assets/icons/closed_eye.svg" alt="Скрыть пароль" on:click={toggleVisiblePassword}/>
        {:else}
            <img src="assets/icons/opened_eye.svg" alt="Показать пароль" on:click={toggleVisiblePassword}/>
        {/if}
    {/if}
</label>

<style>
    label {
        display: flex;
        flex-flow: column;
        font-size: 1.5rem;
        margin-bottom: 10px;
        position: relative;
    }

    .label {
        margin-bottom: 10px;
    }

    input {
        height: 35px;
        width: 270px;
        border-radius: 5px;
        border: 1px solid var(--secondary-text-color);
        padding: 5px 10px;
        transition: var(--transition);
        font-size: 1.5rem;
    }

    input:focus {
        outline: none;
        border: 1px solid var(--accent);
    }

    input:hover {
        border: 1px solid var(--accent);
    }

    input[type='password'] {
        padding-right: 40px;
    }

    input::placeholder {
        font-size: 1.4rem;
        color: var(--secondary-text-color);
    }

    .invalid {
        border: 1px solid var(--alert);
    }

    img {
        width: 20px;
        height: 20px;
        cursor: pointer;
        position: absolute;
        bottom: 8px;
        right: 10px;
    }
</style>