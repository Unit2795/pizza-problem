/*
	I realized that in my previous iteration, I added usage to time slots somewhat blindly.

	If an item had a start time that was in the middle of a time slot, I would just add the full interval time to that slot, which is incorrect.

	In this iteration, if there is less than a full interval remaining in the time slot, I only add the remaining time to that slot before moving on to the next one.
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

const addItem = (item: Item) => {
	const { startTime, prepTime } = item;

	// Find the time slot where this order's usage should begin to be added at
	let timeSlotIndex = timeSlotTimeline.findIndex((slot) => {
		return startTime >= slot.startTime && startTime <= slot.endTime;
	});

	// It's possible that an incoming item may not be found in the precomputed timeline
	if (!timeSlotIndex) {
		throw new Error("No time slot found");
	}

	let remainingCookTime = prepTime;

	// Step through time slots, adding usage time to each
	while (remainingCookTime > 0) {
		// Determine how much time is remaining in the current time slot.
		// We add one because the endTime is inclusive. (IE: a current time of 9 would mean we're on the last minute of the 0-9 slot)
		const currentTimeRemaining = timeSlotTimeline[timeSlotIndex].endTime - startTime + 1;

		// We may only use the max available time for each time slot interval, but we shouldn't overcook the pizza and exceed the remaining cook time!
		const usageThisSlot = Math.min(remainingCookTime, interval, currentTimeRemaining);

		timeSlotTimeline[timeSlotIndex].usedTime += usageThisSlot;

		remainingCookTime -= usageThisSlot;

		timeSlotIndex++;
	}

	items.push(item);
};

addItem({ startTime: 10, prepTime: 25 });
addItem({ startTime: 20, prepTime: 31 });
// Here I test with start times that are not exactly on the time slot boundaries
addItem({ startTime: 12, prepTime: 22 });
addItem({ startTime: 29, prepTime: 30 });

console.log(timeSlotTimeline);
console.log(`Total orders today: ${items.length}`);
console.log(`Total cook time today: ${items.reduce((total, { prepTime }) => total + prepTime, 0)}`);
