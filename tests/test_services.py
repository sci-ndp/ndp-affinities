def test_list_services_empty(client):
    response = client.get("/services")
    assert response.status_code == 200
    assert response.json() == []


def test_create_service(client):
    response = client.post("/services", json={"type": "search", "version": "1.0"})
    assert response.status_code == 201
    data = response.json()
    assert data["type"] == "search"
    assert data["version"] == "1.0"
    assert "uid" in data


def test_get_service(client):
    create_response = client.post("/services", json={"type": "compute"})
    uid = create_response.json()["uid"]

    response = client.get(f"/services/{uid}")
    assert response.status_code == 200
    assert response.json()["type"] == "compute"


def test_get_service_not_found(client):
    response = client.get("/services/00000000-0000-0000-0000-000000000000")
    assert response.status_code == 404


def test_update_service(client):
    create_response = client.post("/services", json={"type": "old"})
    uid = create_response.json()["uid"]

    response = client.put(f"/services/{uid}", json={"type": "new", "openapi_url": "https://api.com"})
    assert response.status_code == 200
    data = response.json()
    assert data["type"] == "new"
    assert data["openapi_url"] == "https://api.com"


def test_update_service_not_found(client):
    response = client.put("/services/00000000-0000-0000-0000-000000000000", json={"type": "X"})
    assert response.status_code == 404


def test_delete_service(client):
    create_response = client.post("/services", json={"type": "to-delete"})
    uid = create_response.json()["uid"]

    response = client.delete(f"/services/{uid}")
    assert response.status_code == 204

    get_response = client.get(f"/services/{uid}")
    assert get_response.status_code == 404


def test_delete_service_not_found(client):
    response = client.delete("/services/00000000-0000-0000-0000-000000000000")
    assert response.status_code == 404


def test_create_service_with_all_fields(client):
    response = client.post("/services", json={
        "type": "api",
        "openapi_url": "https://openapi.com/spec",
        "version": "2.0",
        "source_ep": "ep-456",
        "metadata": {"env": "prod"}
    })
    assert response.status_code == 201
    data = response.json()
    assert data["type"] == "api"
    assert data["openapi_url"] == "https://openapi.com/spec"
    assert data["version"] == "2.0"
    assert data["source_ep"] == "ep-456"
    assert data["metadata"] == {"env": "prod"}
