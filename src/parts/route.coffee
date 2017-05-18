helpers = import './helpers'

module.exports = class Route
	constructor: (@path, @segments, @router)->
		@originalPath = @path
		@enterAction = @leaveAction = helpers.noop
		@actions = []
		@context = {@path, @segments, params:{}}
		@_dynamicFilters = {}


	entering: (fn)->
		@enterAction = fn
		return @

	leaving: (fn)->
		@leaveAction = fn
		return @

	to: (fn)->
		@actions.push fn
		return @

	filters: (filters)->
		@_dynamicFilters = filters
		return @

	remove: ()->
		@router._removeRoute(@)

	_invokeAction: (action, relatedPath, relatedRoute)->
		result = action.call(@context, relatedPath, relatedRoute)
		if result is @router._pendingRoute
			return null
		else
			return result

	_run: (path, prevRoute, prevPath)->
		@_resolveParams(path)
		Promise.resolve(@_invokeAction(@enterAction, prevPath, prevRoute))
			.then ()=> Promise.all @actions.map (action)=> @_invokeAction(action, prevPath, prevRoute)

	_leave: (newRoute, newPath)->
		@_invokeAction(@leaveAction, newPath, newRoute)

	_resolveParams: (path)-> if @segments.hasDynamic
		path = @router._removeBase(path)
		segments = path.split('/')
		
		for dynamicIndex,dynamicSegment of @segments.dynamic
			@context.params[dynamicSegment] = segments[dynamicIndex] or ''

		return

	Object.defineProperty @::, 'map', get: -> @router.map.bind(@router)































