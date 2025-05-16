import AuthLayoutTemplate from '@/layouts/auth/auth-simple-layout';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';


export default function AuthLayout({ children, title, description, backgroundImage, ...props }: { children: React.ReactNode; title: string; description: string, backgroundImage?: string | undefined }) {
    return (
        <AuthLayoutTemplate title={title} description={description} backgroundImage={backgroundImage}  {...props}>
            <>
               <ToastContainer />
                {children}
            </>

        </AuthLayoutTemplate>
    );
}
