

export default function AppLogo() {
    return (
        <>
            <div className="flex aspect-square size-10 items-center justify-center overflow-hidden rounded-md bg-white border border-gray-200 dark:border-gray-800">
                <img src="/images/logo.png" alt="Logo E-CURSUS LMD" className="h-full w-full object-contain" />
            </div>
            <div className="ml-2 grid flex-1 text-left text-sm">
                <span className="mb-0.5 truncate leading-none font-semibold">E-CURSUS LMD</span>
            </div>
        </>
    );
}
