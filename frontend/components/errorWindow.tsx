import React, { useState, useEffect } from 'react';
import s from './header.module.css';


interface ErrorMessageProps {
    errorMessage: string;
    onClose: () => void;
}

const ErrorWindow: React.FC<ErrorMessageProps> = ({ errorMessage, onClose }) => {
    const [timerId, setTimerId] = useState<NodeJS.Timeout | null>(null);
    useEffect(() => {
        const id: NodeJS.Timeout = setTimeout(() => {
            onClose();
        }, 10000);
        setTimerId(id);
        return () => clearTimeout(id);
    }, [onClose]);

    const clearTimer = () => {
        if (timerId !== null) {
            clearTimeout(timerId);
        }
    };

    return (

        <div className={s.errorWindow}>
            {errorMessage}
            <button className={s.errorBut} onClick={() => { onClose(); clearTimer(); }}>Got it!</button>
        </div>

    );
};

export default ErrorWindow;