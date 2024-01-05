import { GroupEventData } from "@/types/types";
import s from './groupEvent.module.css';
import { ChangeEvent, useEffect, useState } from "react";


export default function GroupEvent({ id, creatorId, name, description, time, options, chosenOption, groupId }: GroupEventData) {
    const [formattedTime, setFormattedTime] = useState('');
    const [selectedOption, setSelectedOption] = useState<string>(options[0]);
    const [submitDisabled, setSubmitDisabled] = useState(false);
    const [submitSuccess, setSubmitSuccess] = useState(false);
    const handleOptionChange = (event: ChangeEvent<HTMLInputElement>) => {
        setSelectedOption(event.target.value);
    };

    useEffect(() => {
        const regex = /^(\d{4})-(\d{2})-(\d{2}) (\d{2}):(\d{2})$/;
        const match = time.match(regex);
        if (match) {
            const [, year, month, day, hours, minutes] = match;
            const formattedResult = `${month}.${day}.${year} ${hours}:${minutes}`;
            setFormattedTime(formattedResult);
        }
    }, [time]);

    const handleSubmit = async (event: React.MouseEvent<HTMLButtonElement>) => {
        event.preventDefault();
        try {
            const response = await fetch('/api/chooseEventOption', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    eventId: id,
                    option: selectedOption,
                }),
            });
            if (response.ok) {
                setSubmitSuccess(true);
                setSubmitDisabled(true);
            } else {
                console.error('Failed to choose option: ', await response.text());
            }
        } catch (error) {
            console.error('An error occurred while creating the post:', error);
        }
    };


    return (
        <div key={id} className={s.eventContainer}>

            <p className={s.eventTitle}>{name}</p>

            <div className={s.eventContentContainer}>
                <p className={s.eventDescription}>Description:</p>
                <div className={s.eventContent}>{description}</div>
            </div>

            <div className={s.eventTimeContainer}>
                <p className={s.eventDate}>Date and time:</p>
                <div className={s.eventContent}>{formattedTime}</div>
            </div>

            {chosenOption == "" ? (
                <div className={s.eventOptionsContainer}>
                    <div className={s.radioContainer}>
                        <label htmlFor={`${id}-${options[0]}`} className={s.radioButtonLabel}>
                            <input
                                type="radio"
                                id={`${id}-${options[0]}`}
                                name={`event ${id}`}
                                value={options[0]}
                                checked={selectedOption === options[0]}
                                onChange={handleOptionChange}
                                disabled={submitDisabled}
                            /><span className={s.customRadio}></span>{options[0]}
                        </label>

                        <label htmlFor={`${id}-${options[1]}`} className={s.radioButtonLabel}>
                            <input
                                type="radio"
                                id={`${id}-${options[1]}`}
                                name={`event ${id}`}
                                value={options[1]}
                                checked={selectedOption === options[1]}
                                onChange={handleOptionChange}
                                disabled={submitDisabled}
                            /><span className={s.customRadio}></span>{options[1]}
                        </label>
                    </div>
                    {!submitSuccess && !submitDisabled && (
                        <button onClick={handleSubmit} className={s.submit}>Submit</button>
                    )}
                </div>
            ) : (
                <div className={s.submit}>You chose "{chosenOption}"</div>
            )}
        </div>
    )
}