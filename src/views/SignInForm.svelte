<script lang="ts">
    import Input from "../components/Input.svelte";
    import Button from "../components/Button.svelte";

    interface IValidationItem {
        minlength: number,
        maxlength: number
    }

    interface IValidation {
        email: IValidationItem,
        password: IValidationItem
    }

    const form: { email: string, password: string } = {
        email: '',
        password: ''
    }

    const validation: IValidation = {
        email: {
            minlength: 5,
            maxlength: 50
        },
        password: {
            minlength: 6,
            maxlength: 25
        }
    }

    function validate(type: keyof IValidation, value: string): boolean {
        return value.length >= validation[type].minlength && value.length <= validation[type].maxlength;
    }

    function onSubmit(): void {
        const isValidEmail = validate('email', form.email);
        const isValidPassword = validate('password', form.password);
        if (isValidEmail && isValidPassword) {
            alert(`Welcome ${form.email}!`);
            form.email = '';
            form.password = '';
        }
    }
</script>

<div>
    <h1 class="h1">Welcome to Svelte Form! 🧑🏻‍💻👩🏽‍💻</h1>
    <h2 class="h2">Sign In</h2>
    <form novalidate accept-charset="UTF-8" on:submit|preventDefault={onSubmit} class="sign-in-form">
        <Input type="email"
               label="Email"
               minlength={validation.email.minlength}
               maxlength={validation.email.maxlength}
               pattern={`[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$`}
               bind:value={form.email}
               required
               id="sign-in-email"/>
        <Input type="password"
               label="Password"
               minlength={validation.password.minlength}
               maxlength={validation.password.maxlength}
               bind:value={form.password}
               required
               id="sign-in-password"/>
        <a href="/#">I forgot password or email</a>
        <Button type="submit" disabled={!form.email || !form.password}>Sign In</Button>
    </form>
</div>


<style>
    div {
        width: 100vw;
        height: 100vh;
        display: flex;
        flex-flow: column;
        justify-content: center;
        align-items: center;
    }

    h1 {
        text-align: center;
    }

    h2 {
        margin: 20px 0;
    }

    .sign-in-form {
        display: flex;
        flex-flow: column;
        align-items: flex-start;
    }

    :global(.sign-in-form button) {
        width: 100%;
        margin-top: 20px;
    }

    a {
        font-size: 1.5rem;
    }
</style>