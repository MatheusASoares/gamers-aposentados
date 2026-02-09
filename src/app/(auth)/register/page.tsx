import RegisterForm from "@/components/auth/register-form";

export default function RegisterPage() {
    return (
        <div className="flex justify-center items-center h-screen">
            <div className="relative mx-auto flex w-full max-w-[400px] flex-col space-y-2.5 p-4 md:-mt-32">
                <RegisterForm />
            </div>
        </div>
    );
}
