/*
*   Implement the addItem method so that the final console log meets the following criteria
*
*   We have a timeline of time-slots, each slot 10 minutes apart
*   Our goal is to make it so when an item is added, we calculate how that item effects the timeline.
*   If an item comes in, to be made (startTime) at 10 and a prepTime of 25, we should:
*       Apply 10 minutes worth of prep time to slot timeslot with startTime 10,
        then add 10 to timeslot 20, and finally, 5 to timeslot 30.
*
*   Example input/output:
*
*   addItem is called with a startTime of 10 and prepTime of 35
*   output sample:

        { startTime: 0, endTime: 9, usedTime: 0 },
        { startTime: 10, endTime: 19, usedTime: 10 },
        { startTime: 20, endTime: 29, usedTime: 10 },
        { startTime: 30, endTime: 39, usedTime: 10 },
        { startTime: 40, endTime: 49, usedTime: 5 },
        { startTime: 50, endTime: 59, usedTime: 0 },

*
*   addItem is called again with a startTime of 20 and prepTime of 31
*   output sample:

        { startTime: 0, endTime: 9, usedTime: 0 },
        { startTime: 10, endTime: 19, usedTime: 10 },
        { startTime: 20, endTime: 29, usedTime: 20 },
        { startTime: 30, endTime: 39, usedTime: 20 },
        { startTime: 40, endTime: 49, usedTime: 15 },
        { startTime: 50, endTime: 59, usedTime: 1 },

*
*/

type TimeSlot = {
	startTime: number;
	endTime: number;
	usedTime: number;
};

type Item = {
	startTime: number;
	prepTime: number; // the total prep time for this item
};

const interval = 10; // the number of minutes between each time slot

const timeSlotTimeline: TimeSlot[] = [
	{
		startTime: 0,
		endTime: 9,
		usedTime: 0,
	},
	{
		startTime: 10,
		endTime: 19,
		usedTime: 0,
	},
	{
		startTime: 20,
		endTime: 29,
		usedTime: 0,
	},
	{
		startTime: 30,
		endTime: 39,
		usedTime: 0,
	},
	{
		startTime: 40,
		endTime: 49,
		usedTime: 0,
	},
	{
		startTime: 50,
		endTime: 59,
		usedTime: 0,
	},
	{
		startTime: 60,
		endTime: 69,
		usedTime: 0,
	},
];

const items: Item[] = [];

const addItem = (item: Item) => {};

addItem({ startTime: 10, prepTime: 25 });
// addItem({ startTime: 20, prepTime: 31 })

console.log(timeSlotTimeline);
