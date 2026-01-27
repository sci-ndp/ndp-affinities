def test_list_endpoints_empty(client):
    response = client.get("/ep")
    assert response.status_code == 200
    assert response.json() == []


def test_create_endpoint(client):
    response = client.post("/ep", json={"kind": "globus", "url": "https://example.com"})
    assert response.status_code == 201
    data = response.json()
    assert data["kind"] == "globus"
    assert data["url"] == "https://example.com"
    assert "uid" in data
    assert "created_at" in data
    assert "updated_at" in data


def test_get_endpoint(client):
    # Create
    create_response = client.post("/ep", json={"kind": "http"})
    uid = create_response.json()["uid"]

    # Get
    response = client.get(f"/ep/{uid}")
    assert response.status_code == 200
    assert response.json()["kind"] == "http"


def test_get_endpoint_not_found(client):
    response = client.get("/ep/00000000-0000-0000-0000-000000000000")
    assert response.status_code == 404


def test_update_endpoint(client):
    # Create
    create_response = client.post("/ep", json={"kind": "http"})
    uid = create_response.json()["uid"]

    # Update
    response = client.put(f"/ep/{uid}", json={"kind": "globus", "url": "https://new.com"})
    assert response.status_code == 200
    data = response.json()
    assert data["kind"] == "globus"
    assert data["url"] == "https://new.com"


def test_update_endpoint_not_found(client):
    response = client.put("/ep/00000000-0000-0000-0000-000000000000", json={"kind": "http"})
    assert response.status_code == 404


def test_delete_endpoint(client):
    # Create
    create_response = client.post("/ep", json={"kind": "http"})
    uid = create_response.json()["uid"]

    # Delete
    response = client.delete(f"/ep/{uid}")
    assert response.status_code == 204

    # Verify deleted
    get_response = client.get(f"/ep/{uid}")
    assert get_response.status_code == 404


def test_delete_endpoint_not_found(client):
    response = client.delete("/ep/00000000-0000-0000-0000-000000000000")
    assert response.status_code == 404


def test_create_endpoint_with_metadata(client):
    response = client.post("/ep", json={
        "kind": "s3",
        "metadata": {"bucket": "test", "region": "us-east-1"}
    })
    assert response.status_code == 201
    data = response.json()
    assert data["metadata"] == {"bucket": "test", "region": "us-east-1"}


def test_list_endpoints_with_pagination(client):
    # Create 3 endpoints
    for i in range(3):
        client.post("/ep", json={"kind": f"type{i}"})

    # Test pagination
    response = client.get("/ep?skip=1&limit=1")
    assert response.status_code == 200
    assert len(response.json()) == 1
