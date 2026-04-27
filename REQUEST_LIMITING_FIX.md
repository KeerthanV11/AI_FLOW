# Request Limiting & Throttling Fix

## Problem Identified
The backend was sending too many requests to the Gemini API resulting in:
- High number of API calls in the dashboard
- 0% success rate due to rate limiting
- Multiple retries across 7+ model candidates causing API quota exhaustion

## Root Causes
1. **Multiple Model Candidate Retries** - The service tried 7+ different models, each attempt counting as an API call
2. **No Rate Limiting** - Requests could be sent continuously without delays
3. **No Request Throttling** - Multiple concurrent requests could pile up
4. **Duplicate Requests** - Frontend had no protection against accidental double submissions
5. **No Exponential Backoff** - Failed requests were retried immediately without delays

## Solutions Implemented

### Backend Changes (Python)

#### 1. **Rate Limiting** (`services/gemini_service.py`)
- Added global `_MIN_REQUEST_INTERVAL = 1.0` (1 second minimum between requests)
- Implemented request timing checks that enforce delays
- Uses `time.sleep()` to maintain minimum spacing

```python
# Rate limiting enforced before each API call
current_time = time.time()
time_since_last_request = current_time - _LAST_REQUEST_TIME
if time_since_last_request < _MIN_REQUEST_INTERVAL:
    sleep_time = _MIN_REQUEST_INTERVAL - time_since_last_request
    time.sleep(sleep_time)
```

#### 2. **Exponential Backoff on Retries**
- Changed from retrying 7+ models to only retrying the primary model (max 2 attempts)
- Implemented exponential backoff: 1 second, then 2 seconds, then fail
- Only retries on transient errors (rate limits, timeouts)

```python
max_retries = 2
retry_delay = 1.0  # Start with 1 second
for attempt in range(max_retries):
    try:
        # make API call
    except:
        if attempt < max_retries - 1:
            time.sleep(retry_delay)
            retry_delay *= 2  # Exponential backoff
```

#### 3. **Request Queue/Throttling** (`main.py`)
- Added async lock (`asyncio.Lock`) to prevent concurrent API requests
- Only 1 request can be processed at a time
- Other requests wait in queue instead of creating separate API calls

```python
_GENERATE_LOCK = asyncio.Lock()
async def generate_diagram(request: GenerateRequest):
    async with _GENERATE_LOCK:  # Only one request at a time
        # process request
```

### Frontend Changes (React)

#### 1. **Request Deduplication** (`api/generateTree.js`)
- Tracks pending requests using a Map
- If identical request is already pending, returns existing promise instead of creating new one
- Prevents accidental duplicate submissions from being sent

```javascript
const _pendingRequests = new Map();
// Check if request is already pending
if (_pendingRequests.has(requestKey)) {
    return _pendingRequests.get(requestKey);
}
```

#### 2. **Submission Cooldown** (`components/InputForm.jsx`)
- Enforces 1-second minimum between submissions
- Button is disabled for 1 second after each submission
- Shows "Please wait..." message to user
- Prevents rapid accidental clicks

```javascript
const now = Date.now();
if (now - lastSubmitTime < 1000) {
    console.warn('Submission too fast - please wait before resubmitting');
    return;
}
```

## Impact on API Calls

### Before Fix
- **Per Request**: 7-10+ API calls (trying multiple models)
- **On Rapid Clicks**: 5-10 duplicate requests sent immediately
- **On Errors**: Immediate retries without delays
- **Result**: High quota usage, rate limiting, 0% success

### After Fix
- **Per Request**: 1-2 API calls maximum (primary model only + 1 retry)
- **On Rapid Clicks**: 1 request (deduplicated), others queue
- **On Errors**: Exponential backoff (1s, 2s delays)
- **Result**: ~80-90% reduction in API calls, respects rate limits, higher success rate

## Configuration

To adjust rate limiting, edit `services/gemini_service.py`:
```python
_MIN_REQUEST_INTERVAL = 1.0  # Change this value (in seconds)
max_retries = 2              # Max retry attempts
```

To adjust request queue size, edit `main.py`:
```python
_MAX_CONCURRENT_REQUESTS = 1  # Change this value
```

## Testing Steps

1. Check the backend logs to verify:
   - "Generating diagram for description..." appears once per submission
   - Retries show exponential backoff delays
   - No duplicate "Received response from Gemini" messages

2. Check Google Cloud Console:
   - Significant reduction in total API calls
   - Success rate should be > 90% (up from 0%)
   - Error rate should drop

3. Test rapid submissions in frontend:
   - Click "Generate Diagram" multiple times quickly
   - Should see "Please wait..." message
   - Check backend logs - only 1 request should be received

## Files Modified
- `backend/services/gemini_service.py` - Rate limiting, exponential backoff
- `backend/main.py` - Request throttling with async lock
- `frontend/src/api/generateTree.js` - Request deduplication
- `frontend/src/components/InputForm.jsx` - Submission cooldown
