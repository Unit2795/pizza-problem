/* 
	In this iteration, I try to model a very simple pizza shop. Orders cook in a limited number of ovens and we predict when an order will be done as soon as it arrives.

	This iteration isn't really the same class of problem as the other two, where we are trying to analyze usage over a time series. This instead runs with the pizza shop analogy and instead tries to manage a limited number of ovens and producing an estimate for when a pizza will be done.

	This pizza analogy is useful for thinking about task scheduling and queue theory; which is common in distributed computing, parallelism, and job queues. Ovens can only hold so many pizzas and we want to reduce the amount of time it takes for people to receive their orders. This code doesn't "look ahead" to actually schedule the specific oven that a pizza will go to, though in a production scenario that would probably be useful.

	Code Overview:
	- A simple game loop advances simulated time and places orders.
	- Pizzas cook when oven slots are available and take a variable amount of time to cook.
	- Cooking and completion events are logged.
	
	Features:
	- Oven capacity (limited number of pizzas that can be cooked at once)
	- Pizza queue (pizzas wait if oven is full, pizzas are cooked first-come first-served (FCFS))
	- Game simulation (with optional delay to simulate real time passage)
	- Logging (when pizza cooking starts/ends & how long it took to begin cooking)

	Potential enhancements:
	- Event-driven scheduling (pizza state changes could be scheduled rather than evaluated each tick)
	- Orders (multiple pizzas per order, pizzas in an order cook together, customer can specify a desired ready time)
	- Pizza menu (limited selection of items with different cook/prep times)
	- Order cancellations/modifications while in queue (Shifts order completion estimates)
	- Prep time (Currently we only simulate cook time. This could add challenges like ensuring pizzas aren't laying around uncooked for too long. Or ensuring there isn't a sudden swell of prep that would overwhelm staff)
	- Reject orders that would extend past closing time

	References:
	- https://webia.lip6.fr/~durrc/P_Cmax/ - A cool visualization that demonstrates parallel job scheduling and reducing "makespan" (amount of time to job completion)
*/

interface SimulatedOrder {
	orderTime: number; // When the order is placed
	cookTime: number; // Time needed cook the pizza
}

interface Pizza {
	id: number;
	orderTime: number; // When the pizza was ordered
	cookTime: number; // Time needed to cook the pizza
	cookStartTime?: number; // When cooking began
	cookEndTime: number; // When cooking ended
	idleTime?: number; // Time pizza waited before cooking
}

// CONFIG
const OVEN_CAPACITY = 3; // Max number of pizzas that can be cooked at once

// STATE
let currentTime = 0; // Track the current time in minutes
let nextPizzaId = 1; // Simple incremental ID for pizzas
let currentlyCooking: Pizza[] = []; // Pizzas currently being cooked
const pizzaQueue: Pizza[] = []; // Pizzas waiting to be cooked
const completedPizzas: Pizza[] = []; // Track all pizzas that have been cooked

// Pauses execution for a specified number of milliseconds.
const sleep = async (ms: number) => {
	return new Promise((resolve) => setTimeout(resolve, ms));
};

const logEvents = {
	ORDER: "ORDER RECEIVED",
	QUEUE: "PIZZA QUEUED",
	DONE: "FINISHED COOKING",
	COOK: "STARTED COOKING",
} as const;
// Log a formatted message to the console
const logMessage = (event: (typeof logEvents)[keyof typeof logEvents], message: string) => {
	console.log(`Minute ${currentTime}: [${event}] ${message}`);
};

// Calculate a time series of oven usage given a desired length for each time slot
const calculateOvenUsageTimeSeries = (windowSize: number = 10) => {
	if (completedPizzas.length === 0) return [];
	const timeSeries = [];

	// Iterate through each window
	for (let windowStart = 0; windowStart <= currentTime; windowStart += windowSize) {
		const windowEnd = windowStart + windowSize;
		let totalOvenMinutes = 0;

		// Check each pizza to see if it overlaps with this window
		completedPizzas.forEach((pizza) => {
			if (pizza.cookStartTime === undefined || pizza.cookEndTime === undefined) return;

			// Calculate the overlap between the pizza's cook time and the current window
			const overlapStart = Math.max(pizza.cookStartTime, windowStart);
			const overlapEnd = Math.min(pizza.cookEndTime, windowEnd);

			// If there's an overlap, add the minutes
			if (overlapStart < overlapEnd) {
				totalOvenMinutes += overlapEnd - overlapStart;
			}
		});

		timeSeries.push({
			startTime: windowStart,
			endTime: windowEnd - 1,
			usedTime: totalOvenMinutes,
			utilization: `${Math.round((totalOvenMinutes / (OVEN_CAPACITY * windowSize)) * 100)}%`,
		});
	}

	return timeSeries;
};

// Given an order, return when it is going to be completed
// TODO: This is inefficient due to quadratic behavior. This calculation could likely be memoized so we don't have to repeatedly calculate/simulate the completion times for all pizzas ahead of this one.
const calculateDoneTime = (order: SimulatedOrder): number => {
	// If there is room in the ovens now, the pizza will be done after the current time plus its cook time.
	if (currentlyCooking.length < OVEN_CAPACITY) {
		return order.cookTime + currentTime;
	}

	// See when each oven will be free based on currently cooking pizzas
	const ovenFreeTimes = currentlyCooking.map((pizza) => pizza.cookEndTime);

	/* 
		Iterate over pizzas waiting in the queue, stepping through as if they entered the soonest available oven 
		Eventually we will have the times when the last set of pizzas in the ovens will be done
	*/
	pizzaQueue.forEach((pizza) => {
		// Sort the times when the ovens become free to find which becomes available first
		ovenFreeTimes.sort((a, b) => a - b);

		// Given the soonest available oven time, add this pizza's cook time to it, this is the new time that oven will be free again.
		ovenFreeTimes[0] += pizza.cookTime;
	});

	// Given the last set of times when pizzas will be finished, the soonest one is when this order will start cooking
	const earliestStart = Math.min(...ovenFreeTimes);

	/* 
		Calculate when this new pizza will be DONE 
		Example: Starts at 20, takes 15 minutes, done at 35
	*/
	return earliestStart + order.cookTime;
};

// Push a new order into the queue
const addOrder = (order: SimulatedOrder) => {
	// Evaluate when the pizza will be done for the customer
	const endTime = calculateDoneTime(order);
	/* 
		Determine how long the pizza will need to wait before being placed in the oven
		Calculated by:
		- Subtracting the time when the pizza will be done from when the order was placed to determine the total duration of the order.
		- Then subtracting the cook time from the total duration to determine what time wasn't spent cooking (idle)
	*/
	const idleTime = endTime - order.orderTime - order.cookTime;

	// Increment the pizza ID
	const newPizzaId = nextPizzaId++;
	logMessage(logEvents.ORDER, `Pizza ID: ${newPizzaId}, will be done at minute ${endTime}.`);
	// Will there be a larger wait for this pizza because ovens are busy?
	if (idleTime) {
		logMessage(
			logEvents.QUEUE,
			`Pizza ID: ${newPizzaId}, will need to wait for ${idleTime} minutes before cooking.`
		);
	}

	// Add the pizza order to the queue
	pizzaQueue.push({
		id: newPizzaId,
		orderTime: order.orderTime,
		cookTime: order.cookTime,
		cookEndTime: endTime,
		idleTime,
	});
};

// Process cooking pizzas based on oven capacity
const cookPizzas = () => {
	// Remove any finished pizzas from the oven queue
	currentlyCooking = currentlyCooking.filter((pizza) => {
		// A pizza is considered done if its cook time has begun and the current time is past or equal to its cook end time.
		const done = pizza.cookEndTime !== undefined && pizza.cookEndTime <= currentTime;
		if (done) {
			logMessage(logEvents.DONE, `Pizza ID: ${pizza.id}`);
			// Store the cooked pizza for later calculation
			completedPizzas.push(pizza);
		}
		return !done;
	});

	// If pizzas are waiting in the queue and there's oven capacity, start cooking them
	while (currentlyCooking.length < OVEN_CAPACITY && pizzaQueue.length > 0) {
		// Since our policy is first-come first-served, we'll cook the first pizza off of the queue
		const pizza = pizzaQueue.shift();

		// We do check the length of the queue, but it's still possible shift may return undefined
		if (!pizza) break;

		// Mark the time when the pizza begins and will finish cooking
		pizza.cookStartTime = currentTime;
		pizza.cookEndTime = currentTime + pizza.cookTime;

		// Put the pizza in the oven
		currentlyCooking.push(pizza);

		logMessage(logEvents.COOK, `Pizza ID: ${pizza.id}`);
	}
};

// Simulates the passage of time as orders come in
const simulate = async (orders: SimulatedOrder[], tickDelayMs: number = 0) => {
	console.log("==== Pizza Shop is Open! ====\n");

	// Simple game loop, ticking through each minute until all pizzas are completed
	for (let time = 0; completedPizzas.length < pizzaOrders.length; time++) {
		// Advance the time
		currentTime = time;

		// Check for orders that arrive at this tick
		const ordersAtThisTime = orders.filter((order) => order.orderTime === time);

		// Place the orders
		ordersAtThisTime.forEach((order) => addOrder(order));

		// If there is room in the ovens, add next pizzas
		cookPizzas();

		if (tickDelayMs !== 0) {
			// Simulate real-time passage
			await sleep(tickDelayMs);
		}
	}

	console.log("\n==== Oven Usage Time Series (10-minute windows) ====");
	const timeSeries = calculateOvenUsageTimeSeries(10);
	console.table(timeSeries);
};

const pizzaOrders: SimulatedOrder[] = [
	{ orderTime: 2, cookTime: 15 },
	{ orderTime: 2, cookTime: 12 },
	{ orderTime: 3, cookTime: 15 },
	{ orderTime: 3, cookTime: 20 },
	{ orderTime: 5, cookTime: 15 },
	{ orderTime: 5, cookTime: 10 },
	{ orderTime: 8, cookTime: 15 },
	{ orderTime: 10, cookTime: 30 },
	{ orderTime: 12, cookTime: 15 },
	{ orderTime: 16, cookTime: 20 },
	{ orderTime: 23, cookTime: 10 },
	{ orderTime: 30, cookTime: 15 },
	{ orderTime: 39, cookTime: 15 },
	{ orderTime: 46, cookTime: 20 },
	{ orderTime: 54, cookTime: 15 },
	{ orderTime: 68, cookTime: 15 },
];

// Example where many orders are placed at once
/* const pizzaOrders: SimulatedOrder[] = [
	{ orderTime: 0, cookTime: 10 },
	{ orderTime: 0, cookTime: 10 },
	{ orderTime: 0, cookTime: 10 },
	{ orderTime: 0, cookTime: 10 },
	{ orderTime: 0, cookTime: 10 },
	{ orderTime: 0, cookTime: 10 },
	{ orderTime: 0, cookTime: 10 },
	{ orderTime: 0, cookTime: 10 },
	{ orderTime: 0, cookTime: 10 },
	{ orderTime: 0, cookTime: 10 },
	{ orderTime: 0, cookTime: 10 },
	{ orderTime: 0, cookTime: 10 },
]; */

(async () => {
	await simulate(pizzaOrders, 0); // Set '0' to a number in milliseconds to add a delay between ticks in the game loop to create a more realistic game feel.
})();
