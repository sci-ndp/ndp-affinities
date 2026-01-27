def test_list_service_endpoints_empty(client):
    response = client.get("/service-endpoints")
    assert response.status_code == 200
    assert response.json() == []


def test_create_service_endpoint(client):
    service = client.post("/services", json={"type": "compute"}).json()
    endpoint = client.post("/ep", json={"kind": "http"}).json()

    response = client.post("/service-endpoints", json={
        "service_uid": service["uid"],
        "endpoint_uid": endpoint["uid"],
        "role": "api"
    })
    assert response.status_code == 201
    data = response.json()
    assert data["service_uid"] == service["uid"]
    assert data["endpoint_uid"] == endpoint["uid"]
    assert data["role"] == "api"


def test_get_service_endpoint(client):
    service = client.post("/services", json={"type": "compute"}).json()
    endpoint = client.post("/ep", json={"kind": "http"}).json()
    client.post("/service-endpoints", json={
        "service_uid": service["uid"],
        "endpoint_uid": endpoint["uid"]
    })

    response = client.get(f"/service-endpoints/{service['uid']}/{endpoint['uid']}")
    assert response.status_code == 200


def test_get_service_endpoint_not_found(client):
    response = client.get("/service-endpoints/00000000-0000-0000-0000-000000000000/00000000-0000-0000-0000-000000000001")
    assert response.status_code == 404


def test_delete_service_endpoint(client):
    service = client.post("/services", json={"type": "compute"}).json()
    endpoint = client.post("/ep", json={"kind": "http"}).json()
    client.post("/service-endpoints", json={
        "service_uid": service["uid"],
        "endpoint_uid": endpoint["uid"]
    })

    response = client.delete(f"/service-endpoints/{service['uid']}/{endpoint['uid']}")
    assert response.status_code == 204


def test_delete_service_endpoint_not_found(client):
    response = client.delete("/service-endpoints/00000000-0000-0000-0000-000000000000/00000000-0000-0000-0000-000000000001")
    assert response.status_code == 404
