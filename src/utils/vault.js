let vaultCounter = 0
const vault = {}

function vaultCheck(item) {
	const entry = Object.entries(vault).find(v => v[1] === item)
	if (!entry) {
		const currentId = vaultCounter
		vaultCounter = vaultCounter + 1
		vault[currentId] = item
		return currentId
	}
	return parseInt(entry[0])
}

export default vaultCheck
