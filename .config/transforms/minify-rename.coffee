module.exports = (file, options, file_, content)->
	if options._flags.debug
		return content
	else
		output = content
		replacements.forEach (replacement)->
			source = replacement[0]
			dest = replacement[1]

			output = output.replace(source, dest)
		return output


replacements = [
	[/_fallbackRoute/g, '_F']
	[/_basePath/g, '_bp']
	[/_routesMap/g, '_r']
	[/_priority/g, '_p']
	[/_cache/g, '_c']
	[/_history/g, '_h']
	[/_future/g, '_f']
	[/_globalBefore/g, '_gB']
	[/_globalAfter/g, '_gA']
	[/_pendingRoute/g, '_P']
	[/_activeRoutes/g, '_aR']
	[/_isActive/g, '_a']
	[/_matchPath/g, '_M']
	[/_addRoute/g, '_A']
	[/_onChange/g, '_oC']
	[/_registerBasePath/g, '_reB']
	[/_run/g, '_R']
	[/_leave/g, '_L']
	[/_resolveParams/g, '_RP']
	[/_dynamicFilters/g, '_d']
	[/applyBase/g, 'aB']
	[/removeBase/g, 'rB']
	[/action/g, 'A']
	[/_enterAction/g, 'eA']
	[/_leaveAction/g, 'lA']
	[/_context/g, '_ct']
	[/_passiveVersion/g, '_pv']
	[/_isPassive/g, '_ip']
	[/_hasPassives/g, '_hp']
	[/logError/g, 'lE']
	[/removeItem/g, 'rI']
	[/cleanPath/g, 'cP']
	[/parsePath/g, 'pP']
	[/pathToRegex/g, 'pRE']
	[/segmentsToRegex/g, 'sRE']
	[/copyObject/g, 'cO']
	[/serializeQuery/g, 'sQ']
]
