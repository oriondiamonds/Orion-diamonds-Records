export async function listEnquiries({ page = 1, limit = 25, status = '', search = '', sortDir = 'desc', dateFrom = '', dateTo = '' } = {}) {
  const params = new URLSearchParams({ page, limit, sortDir })
  if (status)   params.set('status', status)
  if (search)   params.set('search', search)
  if (dateFrom) params.set('dateFrom', dateFrom)
  if (dateTo)   params.set('dateTo', dateTo)
  const res = await fetch(`/api/enquiries?${params}`)
  if (!res.ok) throw new Error('Failed to fetch enquiries')
  return res.json()
}

export async function createEnquiry(payload) {
  const res = await fetch('/api/enquiries', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || 'Failed to create enquiry')
  return data
}

export async function getEnquiry(id) {
  const res = await fetch(`/api/enquiries/${id}`)
  if (!res.ok) throw new Error('Enquiry not found')
  return res.json()
}

export async function updateEnquiry(id, payload) {
  const res = await fetch(`/api/enquiries/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || 'Failed to update enquiry')
  return data
}

export async function updateStatus(id, status) {
  const res = await fetch(`/api/enquiries/${id}/status`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status }),
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || 'Failed to update status')
  return data
}

export async function uploadEnquiryImage(id, blob) {
  const form = new FormData()
  form.append('file', blob, 'reference.jpg')
  const res = await fetch(`/api/enquiries/${id}/image`, { method: 'POST', body: form })
  if (!res.ok) throw new Error('Image upload failed')
  return res.json()
}
