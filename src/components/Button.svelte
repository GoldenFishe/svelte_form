<script lang="ts">
    type Type = 'button' | 'submit';

    export let type: Type = 'button';
    export let disabled: boolean = false;
</script>

<button {type} {disabled} on:click>
    <slot/>
</button>

<style>
    button {
        height: 35px;
        padding: 5px 10px;
        font-size: 1.5rem;
        outline: none;
        border: none;
        background: var(--accent);
        border-radius: 5px;
        cursor: pointer;
        color: white;
        transition: var(--transition);
    }

    button:hover {
        filter: brightness(1.3);
    }

    button:disabled {
        opacity: 0.5;
        cursor: not-allowed;
    }
</style>