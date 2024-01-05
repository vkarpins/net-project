import { useState } from "react";
import s from './createEventForm.module.css';
import { GroupEventData } from "@/types/types";

interface CreateGroupEventProps {
    groupId: number | null;
    setEvents: React.Dispatch<React.SetStateAction<GroupEventData[]>>;
    cancelEventCreation: () => void;
}

export function CreateGroupEvent({ groupId, setEvents, cancelEventCreation }: CreateGroupEventProps) {
    const [eventName, setEventName] = useState('');
    const [eventDescription, setEventDescription] = useState('');
    const [eventData, setEventData] = useState('');
    const [eventTime, setEventTime] = useState('');
    const [eventOptionOne, setEventOptionOne] = useState('');
    const [eventOptionTwo, setEventOptionTwo] = useState('');
    const [isEventContainerVisible, setIsEventContainerVisible] = useState(true);
    const [checkGroupId, setCheckGroupId] = useState<number | null>(groupId);
    let options: string[] = [eventOptionOne, eventOptionTwo]
    const handleSubmit = async (event: React.MouseEvent<HTMLButtonElement>) => {
        event.preventDefault();

        if (eventName.trim() === '' || eventDescription.trim() === '') {
            alert('Event name and description are required.');
            return;
        }
        try {
            const response = await fetch('/api/createEvent', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    name: eventName,
                    description: eventDescription,
                    time: `${eventData} ${eventTime}`,
                    options: options,
                    groupId: checkGroupId,
                }),
            });
            if (response.ok) {
                setIsEventContainerVisible(false);

                const newEvent: GroupEventData = await response.json();
                setEvents(prevEvents => [newEvent, ...prevEvents]);

                setEventName('');
                setEventDescription('');
                cancelEventCreation();
                setCheckGroupId(null);

            } else {
                console.error('Failed to create event: ', await response.text());
            }
        } catch (error) {
            console.error('An error occurred while creating the event:', error);
        }
    };

    return (
        <div className={`${s.eventContainer} ${isEventContainerVisible ? '' : s.eventContainerHidden}`}>
            <div className={s.eventTitleSubmit}>
                <input
                    className={s.eventTitle}
                    type="text"
                    placeholder="Add eventname"
                    value={eventName}
                    onChange={(e) => setEventName(e.target.value)}
                />

                <button onClick={handleSubmit} className={s.submit}>Submit</button>
            </div>

            <textarea
                placeholder="Add description"
                className={s.eventField}
                value={eventDescription}
                onChange={(e) => setEventDescription(e.target.value)}
            ></textarea>

            <p className={s.selectDescription}>Select date and time:</p>

            <div className={s.timeOptions}>
                <div>
                    <input
                        className={s.chooseDate}
                        type="date"
                        value={eventData}
                        onChange={(e) => setEventData(e.target.value)}
                    />
                </div>

                <div>
                    <input
                        className={s.chooseTime}
                        type="time"
                        value={eventTime}
                        onChange={(e) => setEventTime(e.target.value)}
                    />
                </div>
            </div>
            <p className={s.optionsDescription}>Add options:</p>

            <div className={s.chooseOptions}>
                <input
                    className={s.firstOption}
                    type="text"
                    placeholder="1 option"
                    value={eventOptionOne}
                    onChange={(e) => setEventOptionOne(e.target.value)}
                />

                <input
                    className={s.secondOption}
                    type="text"
                    placeholder="2 option"
                    value={eventOptionTwo}
                    onChange={(e) => setEventOptionTwo(e.target.value)}
                />
            </div>

        </div>
    )
}

