// Prop-types and respective possible prop-values
export const possibleValues = [
	{
		position:
			'auto auto-start auto-end top top-start top-end bottom bottom-start bottom-end right right-start right-end left left-start left-end',
	},
	{ animation: 'fade slide pop scale static' },
	{ class: 'class:' },
	{ arrow: 'arrow:sm arrow:md arrow:lg arrow:rd arrow:none' },
	{ flip: 'flip:off flip:on' },
	{ fixed: 'fixed:off fixed:on' },
	{ delay: 'delay' },
	{ group: 'group:' },
	{ magnet: 'magnet:on magnet:off' },
	{ merge: 'merge overwrite' },
	{ maxw: 'maxw:' },
]

function configParser(configString, eventType, targetElement) {
	// Convert string into array
	const configArray = configString.toLowerCase().trim().split(' ')

	// Check and transform values in array
	const finalConfig = check(configArray)

	try {
		if (!finalConfig.position) {
			throw new Error(
				`Requirements for a minimal setup are not met. Make sure to provide position in your config-string: ${configString}`
			)
		} else if ((eventType === 'click' && finalConfig.methodLength) || finalConfig.positionLength) {
			console.warn(`Unnecessary length was provided in config-string "${configString}"`)
		}
	} catch (e) {
		console.error('Something is wrong with your config')
		console.error('Tooltip anchor is:', targetElement)
		console.error('Config is:', configString)
		console.error(e)
	}

	// Return ready-to-use config object
	return finalConfig
}

function extractValuefromString(str, reverse = false) {
	if (reverse) {
		return str.replace(/\d/g, '')
	} else {
		return str.replace(/\D/g, '')
	}
}

function classAndGroupExtractor(classOrGroupString) {
	return classOrGroupString.substr(6)
}

function maxWidthExtractor(classOrGroupString) {
	return classOrGroupString.substr(5)
}

function delayExctractor(delayString) {
	const delay = delayString.substr(5)
	if (delay.match(/(\d+-\d+)/)) {
		return delay.split('-')
	} else {
		return [delay, delay]
	}
}

function check(array) {
	// console.log(array)
	let values = {}
	// Additional values-object for tracking if all entries from incoming array is converted
	const valuesConverted = []

	// Go through each prop-value in config array...
	array.forEach(a => {
		// ...and each prop-type in 'possible-values' array.
		possibleValues.forEach(b => {
			const [[bKey, bValue]] = Object.entries(b)
			// Check if prop-value (stripped of number at the end with RegExp) is found in 'possible-values' array...
			if (bValue.split(' ').some(bVal => extractValuefromString(a, true).includes(bVal))) {
				// Check for props of the same type (e.g. 'top' and 'left'), if found - throw an error.
				if (values.hasOwnProperty(bKey)) {
					throw new Error(`Found conflicting property values: value ${a} and value ${values[bKey]} of property ${bKey}`)
				}
				// ...and add found prop-types and prop-values to value array (if there's number at the end, split it into two different props (e.g. animation & animationLength  ))
				if (bKey === 'animation') {
					if (a === 'static') {
						values = {
							...values,
							animation: ['', ''],
						}
						valuesConverted.push(a)
					} else {
						values = {
							...values,
							animation: [extractValuefromString(a, true), extractValuefromString(a)],
						}
						valuesConverted.push(a)
					}
				} else if (bKey === 'class') {
					values = { ...values, class: classAndGroupExtractor(a) }
					valuesConverted.push(a)
				} else if (bKey === 'group') {
					values = { ...values, group: classAndGroupExtractor(a) }
					valuesConverted.push(a)
				} else if (bKey === 'delay') {
					values = { ...values, delay: delayExctractor(a) }
					valuesConverted.push(a)
				} else if (bKey === 'maxw') {
					values = { ...values, maxw: maxWidthExtractor(a) }
					valuesConverted.push(a)
				} else if (bKey === 'flip' || bKey === 'fixed' || bKey === 'magnet') {
					const aVal = a.endsWith(':on') ? true : false
					values = { ...values, [bKey]: aVal }
					valuesConverted.push(a)
				} else {
					values = { ...values, [bKey]: a }
					valuesConverted.push(a)
				}
			}
		})
	})

	const checkForUnknowns = array.map(v => [v, valuesConverted.some(vConverted => v === vConverted)])
	checkForUnknowns.forEach(e => {
		if (!e[1]) {
			throw new Error(`Unknown config value: ${e[0]}`)
		}
	})

	return values
}

export default configParser

export function mergeConfigs(targetConfig, defaultConfig, eventType, targetElement) {
	const parsedTargetConfig = configParser(targetConfig, eventType, targetElement)
	if (parsedTargetConfig.merge === 'overwrite') {
		return parsedTargetConfig
	}

	const parsedDefaultConfig = configParser(defaultConfig, eventType, targetElement)

	const finalConfig = {}
	objectCopy(finalConfig, parsedDefaultConfig)
	objectCopy(finalConfig, parsedTargetConfig)

	return finalConfig
}

function objectCopy(objectForStoring, objectToCopyFrom) {
	console.log('debuging: for storing', objectForStoring)
	console.log('debuging: from', objectToCopyFrom)
	for (const [key, value] of Object.entries(objectToCopyFrom)) {
		let newValue
		if (typeof value === 'object') {
			newValue = Array.isArray(value) ? [] : {}
			objectCopy(newValue, value)
		} else {
			newValue = value
		}
		objectForStoring[key] = newValue
	}
}
