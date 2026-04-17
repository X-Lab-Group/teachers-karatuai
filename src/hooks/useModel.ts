import { useContext } from 'react'
import { ModelStatusContext, ModelActionsContext } from '../contexts/model-context'

export function useModel() {
  const status = useContext(ModelStatusContext)
  const actions = useContext(ModelActionsContext)
  if (!status || !actions) {
    throw new Error('useModel must be used within ModelProvider')
  }
  return { ...status, ...actions }
}

export function useModelStatus() {
  const status = useContext(ModelStatusContext)
  if (!status) {
    throw new Error('useModelStatus must be used within ModelProvider')
  }
  return status
}

export function useModelActions() {
  const actions = useContext(ModelActionsContext)
  if (!actions) {
    throw new Error('useModelActions must be used within ModelProvider')
  }
  return actions
}
